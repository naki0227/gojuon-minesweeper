// Online play server. Every room change goes through here: matching by
// 合言葉 or at random, moves, timeouts, rematches and leaving. The answer
// and all judgements stay in `online_room_secrets`, which clients can't
// read; players only see `online_rooms.public_state`.
//
// The game rules come from the app's own source, copied into
// ../_shared/app by `npm run online:sync` before deploying.

import { createClient } from "npm:@supabase/supabase-js@2";

import type { GameState } from "../_shared/app/game/engine.ts";
import {
  normalizeRoomCode,
  seatOf,
  TURN_SECONDS,
  type OnlineMove,
  type OnlineRoom,
} from "../_shared/app/online/protocol.ts";
import {
  applyMove,
  concedeGame,
  restoreGame,
  sanitizeFilters,
  sanitizeLanguage,
  startOnlineGame,
  storeGame,
  toPublicState,
  type StoredGame,
} from "../_shared/app/online/rules.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Waiting rooms nobody joined, and games nobody touched, are closed after
// these many minutes. Random-match rooms expire quickly so absent players
// are not matched. Code rooms keep the longer limit because app builds
// before 2026-10-12 do not send heartbeats while waiting for a friend.
const RANDOM_WAITING_TTL_MINUTES = 2;
const CODE_WAITING_TTL_MINUTES = 30;
const IDLE_TTL_MINUTES = 24 * 60;
// Closed rooms (and their hidden state) are deleted after a week.
const CLOSED_TTL_MINUTES = 7 * 24 * 60;

class UserError extends Error {}

function respond(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function waitingTtlMinutes(room: OnlineRoom): number {
  return room.kind === "random"
    ? RANDOM_WAITING_TTL_MINUTES
    : CODE_WAITING_TTL_MINUTES;
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function deadlineFromNow(): string {
  return new Date(Date.now() + TURN_SECONDS * 1000).toISOString();
}

function must<T>(result: { data: T; error: unknown }): T {
  if (result.error) {
    throw result.error;
  }
  return result.data;
}

async function closeStaleRooms(): Promise<void> {
  must(
    await admin
      .from("online_rooms")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("status", "waiting")
      .eq("kind", "random")
      .lt("updated_at", minutesAgo(RANDOM_WAITING_TTL_MINUTES)),
  );
  must(
    await admin
      .from("online_rooms")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("status", "waiting")
      .eq("kind", "code")
      .lt("updated_at", minutesAgo(CODE_WAITING_TTL_MINUTES)),
  );
  must(
    await admin
      .from("online_rooms")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .in("status", ["playing", "finished"])
      .lt("updated_at", minutesAgo(IDLE_TTL_MINUTES)),
  );
  must(
    await admin
      .from("online_rooms")
      .delete()
      .eq("status", "closed")
      .lt("updated_at", minutesAgo(CLOSED_TTL_MINUTES)),
  );
}

// A player waits in at most one room at a time.
async function closeMyWaitingRooms(userId: string): Promise<void> {
  must(
    await admin
      .from("online_rooms")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("status", "waiting")
      .contains("players", [userId]),
  );
}

async function loadRoom(roomId: string): Promise<OnlineRoom> {
  const room = must(
    await admin.from("online_rooms").select("*").eq("id", roomId).maybeSingle(),
  ) as OnlineRoom | null;
  if (!room) {
    throw new UserError("部屋が見つかりません。");
  }
  return room;
}

async function loadGame(
  roomId: string,
): Promise<{ state: GameState; version: number }> {
  const secret = must(
    await admin
      .from("online_room_secrets")
      .select("state, version")
      .eq("room_id", roomId)
      .maybeSingle(),
  ) as { state: StoredGame; version: number } | null;
  const state = secret ? restoreGame(secret.state) : null;
  if (!secret || !state) {
    throw new UserError("対戦の準備ができていません。");
  }
  return { state, version: secret.version };
}

const CONFLICT_MESSAGE = "ほかの操作と重なりました。もう一度どうぞ。";

// Writes the hidden and public state in one database transaction. The room
// must still be playing at `expectedVersion`; otherwise another request won
// and nothing is written.
async function commitGame(
  room: OnlineRoom,
  state: GameState,
  expectedVersion: number,
  options: {
    status?: "closed";
    endReason?: OnlineRoom["end_reason"];
    requireExpiredDeadline?: boolean;
  } = {},
): Promise<OnlineRoom> {
  const finished = state.phase === "finished";
  const status = options.status ?? (finished ? "finished" : "playing");
  const updated = must(
    await admin.rpc("online_commit_game", {
      p_room_id: room.id,
      p_expected_version: expectedVersion,
      p_secret_state: storeGame(state),
      p_public_state: toPublicState(state),
      p_status: status,
      p_turn_deadline: status === "playing" ? deadlineFromNow() : null,
      p_end_reason:
        options.endReason ??
        (finished ? (state.winner === null ? "draw" : "answer") : null),
      p_require_expired_deadline: options.requireExpiredDeadline ?? false,
    }),
  ) as OnlineRoom | null;
  if (!updated?.id) {
    throw new UserError(CONFLICT_MESSAGE);
  }
  return updated;
}

// Takes a waiting room for `userId` and starts the game in one transaction.
// Only one caller can win the race; the loser gets null.
async function claimRoom(
  room: OnlineRoom,
  userId: string,
): Promise<OnlineRoom | null> {
  const state = startOnlineGame(sanitizeFilters(room.filters));
  const started = must(
    await admin.rpc("online_start_game", {
      p_room_id: room.id,
      p_user_id: userId,
      p_secret_state: storeGame(state),
      p_public_state: toPublicState(state),
      p_turn_deadline: deadlineFromNow(),
    }),
  ) as OnlineRoom | null;
  return started?.id ? started : null;
}

async function joinByCode(
  userId: string,
  rawCode: unknown,
  rawFilters: unknown,
): Promise<OnlineRoom> {
  const code = normalizeRoomCode(typeof rawCode === "string" ? rawCode : "");
  if (!code) {
    throw new UserError("合言葉は2〜16文字で入力してください。");
  }

  await closeMyWaitingRooms(userId);

  // Two tries: someone else may create the waiting room between our lookup
  // and our insert.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const waiting = must(
      await admin
        .from("online_rooms")
        .select("*")
        .eq("kind", "code")
        .eq("code", code)
        .eq("status", "waiting")
        .limit(1),
    ) as OnlineRoom[];
    const room = waiting[0];

    if (room && !room.players.includes(userId)) {
      const joined = await claimRoom(room, userId);
      if (joined) {
        return joined;
      }
      continue;
    }

    const inserted = await admin
      .from("online_rooms")
      .insert({
        kind: "code",
        code,
        players: [userId],
        filters: sanitizeFilters(rawFilters),
      })
      .select("*")
      .single();
    if (!inserted.error) {
      return inserted.data as OnlineRoom;
    }
    if ((inserted.error as { code?: string }).code !== "23505") {
      throw inserted.error;
    }
  }

  throw new UserError("混み合っています。もう一度どうぞ。");
}

// The database serializes each language queue. The caller's POST either
// joins the oldest waiting player or creates one room; no match retry loop.
async function quickMatch(
  userId: string,
  rawLanguage: unknown,
  previousRoomId: string,
): Promise<OnlineRoom> {
  const language = sanitizeLanguage(rawLanguage);
  const state = startOnlineGame({ language, categories: [], length: "any" });
  return must(
    await admin.rpc("quick_match_room", {
      p_user_id: userId,
      p_language: language,
      p_previous_room_id: previousRoomId || null,
      p_secret_state: storeGame(state),
      p_public_state: toPublicState(state),
      p_turn_deadline: deadlineFromNow(),
    }),
  ) as OnlineRoom;
}

// A waiting screen renews its room every 30s. A closed/started room is
// returned unchanged so the client can leave the waiting screen.
async function heartbeat(userId: string, roomId: string): Promise<OnlineRoom> {
  const room = await loadRoom(roomId);
  requireSeat(room, userId);
  if (room.status !== "waiting") {
    return room;
  }
  const renewed = must(
    await admin
      .from("online_rooms")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", roomId)
      .eq("status", "waiting")
      .gte("updated_at", minutesAgo(waitingTtlMinutes(room)))
      .select("*"),
  ) as OnlineRoom[];
  if (renewed[0]) {
    return renewed[0];
  }
  const latest = await loadRoom(roomId);
  if (latest.status !== "waiting") {
    return latest;
  }
  return cancel(userId, roomId);
}

function requireSeat(room: OnlineRoom, userId: string) {
  const seat = seatOf(room, userId);
  if (seat === null) {
    throw new UserError("この部屋の参加者ではありません。");
  }
  return seat;
}

async function cancel(userId: string, roomId: string): Promise<OnlineRoom> {
  const room = await loadRoom(roomId);
  requireSeat(room, userId);
  if (room.status !== "waiting") {
    return room;
  }
  const closed = must(
    await admin
      .from("online_rooms")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("id", roomId)
      .eq("status", "waiting")
      .select("*"),
  ) as OnlineRoom[];
  // Matched just before the cancel landed: hand back the started game.
  return closed[0] ?? loadRoom(roomId);
}

async function move(
  userId: string,
  roomId: string,
  playerMove: OnlineMove,
): Promise<OnlineRoom> {
  const room = await loadRoom(roomId);
  const seat = requireSeat(room, userId);
  if (room.status !== "playing") {
    throw new UserError("対戦中ではありません。");
  }
  const { state, version } = await loadGame(roomId);
  const result = applyMove(state, seat, playerMove ?? { type: "pass" });
  if (!result.ok) {
    throw new UserError(result.error);
  }
  return commitGame(room, result.state, version);
}

async function claimTimeout(
  userId: string,
  roomId: string,
): Promise<OnlineRoom> {
  const room = await loadRoom(roomId);
  const seat = requireSeat(room, userId);
  if (room.status !== "playing" || !room.turn_deadline) {
    return room;
  }
  if (new Date(room.turn_deadline).getTime() > Date.now()) {
    throw new UserError("まだ持ち時間が残っています。");
  }
  const { state, version } = await loadGame(roomId);
  // The deadline above belongs to the room as read; a newer hidden state
  // means the opponent already moved and has a fresh deadline.
  if (version !== room.version) {
    throw new UserError(CONFLICT_MESSAGE);
  }
  if (state.currentPlayer === seat) {
    throw new UserError("あなたの手番です。");
  }
  return commitGame(
    room,
    concedeGame(state, state.currentPlayer, "timeout"),
    version,
    { endReason: "timeout", requireExpiredDeadline: true },
  );
}

async function rematch(userId: string, roomId: string): Promise<OnlineRoom> {
  const room = await loadRoom(roomId);
  requireSeat(room, userId);
  if (room.status !== "finished") {
    throw new UserError("この部屋ではもう一戦できません。");
  }

  // The flag and, once both agree, the next game are written together. The
  // next game is prepared up front and avoids repeating the question.
  const { state } = await loadGame(roomId);
  const next = startOnlineGame(
    sanitizeFilters(room.filters),
    state.question.id,
  );
  const updated = must(
    await admin.rpc("online_request_rematch", {
      p_room_id: roomId,
      p_user_id: userId,
      p_expected_version: room.version,
      p_secret_state: storeGame(next),
      p_public_state: toPublicState(next),
      p_turn_deadline: deadlineFromNow(),
    }),
  ) as OnlineRoom | null;
  return updated?.id ? updated : loadRoom(roomId);
}

async function leave(userId: string, roomId: string): Promise<OnlineRoom> {
  const room = await loadRoom(roomId);
  const seat = requireSeat(room, userId);

  if (room.status === "waiting") {
    return cancel(userId, roomId);
  }
  if (room.status === "playing") {
    const { state, version } = await loadGame(roomId);
    return commitGame(room, concedeGame(state, seat, "forfeit"), version, {
      status: "closed",
      endReason: "forfeit",
    });
  }
  if (room.status === "finished") {
    return must(
      await admin
        .from("online_rooms")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", roomId)
        .select("*")
        .single(),
    ) as OnlineRoom;
  }
  return room;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return respond({ ok: false, error: "POST only" }, 405);
  }

  const token = request.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "");
  const { data } = token
    ? await admin.auth.getUser(token)
    : { data: { user: null } };
  const userId = data.user?.id;
  if (!userId) {
    return respond({ ok: false, error: "ログインできませんでした。" }, 401);
  }

  try {
    const body = await request.json();
    const roomId = typeof body.roomId === "string" ? body.roomId : "";
    let room: OnlineRoom | null;

    switch (body.action) {
      case "join_code":
        await closeStaleRooms();
        room = await joinByCode(userId, body.code, body.filters);
        break;
      case "quick_match":
        await closeStaleRooms();
        room = await quickMatch(userId, body.language, roomId);
        break;
      case "heartbeat":
        room = await heartbeat(userId, roomId);
        break;
      case "cancel":
        room = await cancel(userId, roomId);
        break;
      case "move":
        room = await move(userId, roomId, body.move);
        break;
      case "claim_timeout":
        room = await claimTimeout(userId, roomId);
        break;
      case "rematch":
        room = await rematch(userId, roomId);
        break;
      case "leave":
        room = await leave(userId, roomId);
        break;
      default:
        return respond({ ok: false, error: "不明な操作です。" }, 400);
    }

    return respond({ ok: true, room });
  } catch (error) {
    if (error instanceof UserError) {
      return respond({ ok: false, error: error.message }, 409);
    }
    console.error(error);
    return respond(
      { ok: false, error: "サーバーでエラーが起きました。" },
      500,
    );
  }
});
