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
// these many minutes.
const WAITING_TTL_MINUTES = 2;
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
      .lt("updated_at", minutesAgo(WAITING_TTL_MINUTES)),
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

// Writes a new game state. The secret row's version is the lock: if another
// request changed the game first, nothing is written and the player retries.
async function commitGame(
  room: OnlineRoom,
  state: GameState,
  expectedVersion: number,
  extra: Partial<OnlineRoom> = {},
): Promise<OnlineRoom> {
  const version = expectedVersion + 1;
  const now = new Date().toISOString();
  const updated = must(
    await admin
      .from("online_room_secrets")
      .update({ state: storeGame(state), version, updated_at: now })
      .eq("room_id", room.id)
      .eq("version", expectedVersion)
      .select("room_id"),
  ) as unknown[];
  if (updated.length === 0) {
    throw new UserError("ほかの操作と重なりました。もう一度どうぞ。");
  }

  const finished = state.phase === "finished";
  return must(
    await admin
      .from("online_rooms")
      .update({
        public_state: toPublicState(state),
        version,
        status: finished ? "finished" : "playing",
        turn_deadline: finished ? null : deadlineFromNow(),
        end_reason: finished
          ? state.winner === null
            ? "draw"
            : "answer"
          : null,
        updated_at: now,
        ...extra,
      })
      .eq("id", room.id)
      .select("*")
      .single(),
  ) as OnlineRoom;
}

// Starts a fresh game in a room that just got its second player (or both
// players asked for a rematch).
async function startGame(
  room: OnlineRoom,
  players: readonly string[],
  excludeId?: string,
): Promise<OnlineRoom> {
  const state = startOnlineGame(sanitizeFilters(room.filters), excludeId);
  const version = room.version + 1;
  const now = new Date().toISOString();

  must(
    await admin.from("online_room_secrets").upsert({
      room_id: room.id,
      state: storeGame(state),
      version,
      updated_at: now,
    }),
  );

  return must(
    await admin
      .from("online_rooms")
      .update({
        players,
        status: "playing",
        public_state: toPublicState(state),
        version,
        turn_deadline: deadlineFromNow(),
        rematch: [false, false],
        end_reason: null,
        updated_at: now,
      })
      .eq("id", room.id)
      .select("*")
      .single(),
  ) as OnlineRoom;
}

// Takes a waiting room for `userId`. Only one caller can win the race,
// because the update only matches while the room is still waiting.
async function claimRoom(
  room: OnlineRoom,
  userId: string,
): Promise<OnlineRoom | null> {
  const players = [...room.players, userId];
  const claimed = must(
    await admin
      .from("online_rooms")
      .update({
        status: "playing",
        players,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id)
      .eq("status", "waiting")
      .select("*"),
  ) as OnlineRoom[];
  const taken = claimed[0];
  return taken ? startGame(taken, players) : null;
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
      .gte("updated_at", minutesAgo(WAITING_TTL_MINUTES))
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
  if (state.currentPlayer === seat) {
    throw new UserError("あなたの手番です。");
  }
  return commitGame(
    room,
    concedeGame(state, state.currentPlayer, "timeout"),
    version,
    { end_reason: "timeout" },
  );
}

async function rematch(userId: string, roomId: string): Promise<OnlineRoom> {
  const room = await loadRoom(roomId);
  const seat = requireSeat(room, userId);
  if (room.status !== "finished") {
    throw new UserError("この部屋ではもう一戦できません。");
  }

  const flags = [room.rematch[0] ?? false, room.rematch[1] ?? false];
  flags[seat] = true;
  const updated = must(
    await admin
      .from("online_rooms")
      .update({ rematch: flags, updated_at: new Date().toISOString() })
      .eq("id", roomId)
      .eq("status", "finished")
      .eq("version", room.version)
      .select("*"),
  ) as OnlineRoom[];
  const next = updated[0];
  if (!next) {
    return loadRoom(roomId);
  }
  if (!flags[0] || !flags[1]) {
    return next;
  }

  // Both agreed: swap seats so the other player moves first, and avoid
  // repeating the question.
  const { state } = await loadGame(roomId);
  return startGame(next, [...next.players].reverse(), state.question.id);
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
      end_reason: "forfeit",
      turn_deadline: null,
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
