// Shapes shared by the app and the `online-game` Edge Function.
// Keep this file free of imports that pull in the question bank: the
// client imports it for types and constants only.

import type { QuestionFilters, QuestionLanguage } from "../data/types";
import type { GamePhase, PlayerIndex } from "../game/engine";

export const ONLINE_FUNCTION_NAME = "online-game";

// Seconds a player has for one turn before the opponent may claim the win.
export const TURN_SECONDS = 90;

export const ROOM_CODE_MIN_LENGTH = 2;
export const ROOM_CODE_MAX_LENGTH = 16;

export type RoomKind = "code" | "random";
export type RoomStatus = "waiting" | "playing" | "finished" | "closed";
export type RoomEndReason = "answer" | "draw" | "timeout" | "forfeit";

// What both players may see. The answer itself only appears once the game
// is finished.
export type OnlinePublicState = {
  language: QuestionLanguage;
  prompt: string;
  phase: GamePhase;
  currentPlayer: PlayerIndex;
  openedChars: readonly string[];
  mineChars: readonly string[];
  mineCounts: Readonly<Record<string, number>>;
  answerBlocked: readonly [boolean, boolean];
  hint: string | null;
  winner: PlayerIndex | null;
  lastMessage: string;
  answers: readonly string[] | null;
};

// A row of the `online_rooms` table as the client reads it.
export type OnlineRoom = {
  id: string;
  kind: RoomKind;
  code: string | null;
  match_key: string | null;
  status: RoomStatus;
  players: readonly string[];
  filters: QuestionFilters;
  public_state: OnlinePublicState | null;
  version: number;
  turn_deadline: string | null;
  rematch: readonly boolean[];
  end_reason: RoomEndReason | null;
  created_at: string;
  updated_at: string;
};

export type OnlineMove =
  | { type: "answer"; text: string }
  | { type: "pass" }
  | { type: "open"; char: string };

export type OnlineRequest =
  | { action: "join_code"; code: string; filters: QuestionFilters }
  | {
      action: "quick_match";
      language: QuestionLanguage | "any";
      // The room this player is already queued in, when retrying.
      roomId?: string;
    }
  | { action: "cancel"; roomId: string }
  | { action: "move"; roomId: string; move: OnlineMove }
  | { action: "claim_timeout"; roomId: string }
  | { action: "rematch"; roomId: string }
  | { action: "leave"; roomId: string };

export type OnlineResponse =
  { ok: true; room: OnlineRoom | null } | { ok: false; error: string };

function katakanaToHiragana(value: string): string {
  return value.replace(/[ァ-ヶ]/g, (char) =>
    String.fromCodePoint(char.codePointAt(0)! - 0x60),
  );
}

// Both players type the same 合言葉; width, case, kana type and spaces must
// not matter. Returns null when the code is too short or too long.
export function normalizeRoomCode(raw: string): string | null {
  const code = katakanaToHiragana(
    raw.normalize("NFKC").toLocaleLowerCase(),
  ).replace(/\s+/g, "");
  const length = Array.from(code).length;

  if (length < ROOM_CODE_MIN_LENGTH || length > ROOM_CODE_MAX_LENGTH) {
    return null;
  }

  return code;
}

// Index of `userId` in the room, or null for a spectator.
export function seatOf(
  room: Pick<OnlineRoom, "players">,
  userId: string,
): PlayerIndex | null {
  const index = room.players.indexOf(userId);
  return index === 0 || index === 1 ? index : null;
}
