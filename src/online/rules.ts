// Server-side rules for online play. The `online-game` Edge Function runs
// this file (copied by scripts/sync-online-function.mjs), so the answer and
// every judgement stay on the server; clients only ever get the public
// projection from `toPublicState`.

import {
  pickRandomQuestion,
  QUESTIONS,
  questionPrompt,
} from "../data/questions";
import type {
  LengthFilter,
  Question,
  QuestionFilters,
  QuestionLanguage,
} from "../data/types";
import { getBoardOrder } from "../game/board";
import {
  adjacentMineCount,
  answerHint,
  createInitialState,
  openCharacter,
  passAnswer,
  questionMineCharacters,
  submitAnswer,
  type GameState,
  type PlayerIndex,
} from "../game/engine";
import type { OnlineMove, OnlinePublicState } from "./protocol";

// What the server stores between requests: the engine state with the
// question replaced by its id.
export type StoredGame = Omit<GameState, "question"> & { questionId: string };

const QUESTIONS_BY_ID = new Map(
  QUESTIONS.map((question) => [question.id, question]),
);

const MAX_ANSWER_LENGTH = 64;
const MAX_CATEGORIES = 200;

export const DEFAULT_ONLINE_FILTERS: QuestionFilters = {
  language: "ja",
  categories: [],
  length: "any",
};

function sanitizeLength(raw: unknown): LengthFilter {
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw === "object" && raw !== null) {
    const { min, max } = raw as { min?: unknown; max?: unknown };
    if (
      typeof min === "number" &&
      Number.isInteger(min) &&
      (max === null || (typeof max === "number" && Number.isInteger(max)))
    ) {
      return { min, max };
    }
  }
  return "any";
}

// Filters arrive from the client, so accept only the known shapes.
export function sanitizeFilters(raw: unknown): QuestionFilters {
  if (typeof raw !== "object" || raw === null) {
    return DEFAULT_ONLINE_FILTERS;
  }

  const { language, categories, length } = raw as Record<string, unknown>;

  return {
    language:
      language === "ja" || language === "en" || language === "any"
        ? language
        : "ja",
    categories: Array.isArray(categories)
      ? categories
          .filter(
            (category): category is string => typeof category === "string",
          )
          .slice(0, MAX_CATEGORIES)
      : [],
    length: sanitizeLength(length),
  };
}

export function sanitizeLanguage(raw: unknown): QuestionLanguage | "any" {
  return raw === "ja" || raw === "en" || raw === "any" ? raw : "ja";
}

// Picks a question for the filters, falling back to the whole language (and
// then to everything) so a room never fails to start.
export function pickOnlineQuestion(
  filters: QuestionFilters,
  excludeId?: string,
): Question {
  const question =
    pickRandomQuestion(filters, excludeId) ??
    pickRandomQuestion(
      { language: filters.language, categories: [], length: "any" },
      excludeId,
    ) ??
    pickRandomQuestion(DEFAULT_ONLINE_FILTERS, excludeId);

  if (!question) {
    throw new Error("The question bank is empty");
  }

  return question;
}

export function startOnlineGame(
  filters: QuestionFilters,
  excludeId?: string,
): GameState {
  return createInitialState(pickOnlineQuestion(filters, excludeId));
}

export function storeGame(state: GameState): StoredGame {
  const { question, ...rest } = state;
  return { ...rest, questionId: question.id };
}

export function restoreGame(stored: StoredGame): GameState | null {
  const { questionId, ...rest } = stored;
  const question = QUESTIONS_BY_ID.get(questionId);
  return question ? { ...rest, question } : null;
}

export function toPublicState(state: GameState): OnlinePublicState {
  const mines = questionMineCharacters(state.question);
  const mineChars: string[] = [];
  const mineCounts: Record<string, number> = {};

  for (const char of state.openedChars) {
    if (mines.has(char)) {
      mineChars.push(char);
    } else {
      mineCounts[char] = adjacentMineCount(state.question, char);
    }
  }

  const finished = state.phase === "finished";

  return {
    language: state.question.language,
    prompt: questionPrompt(state.question),
    phase: state.phase,
    currentPlayer: state.currentPlayer,
    openedChars: state.openedChars,
    mineChars,
    mineCounts,
    answerBlocked: state.answerBlocked,
    hint: state.revealedAnswerChars > 0 && !finished ? answerHint(state) : null,
    winner: state.winner,
    lastMessage: state.lastMessage,
    answers: finished
      ? state.question.answers.map((answer) => answer.display)
      : null,
  };
}

export type MoveResult =
  { ok: true; state: GameState } | { ok: false; error: string };

export function applyMove(
  state: GameState,
  seat: PlayerIndex,
  move: OnlineMove,
): MoveResult {
  if (state.phase === "finished") {
    return { ok: false, error: "この対戦は終わっています。" };
  }
  if (state.currentPlayer !== seat) {
    return { ok: false, error: "相手の手番です。" };
  }

  switch (move.type) {
    case "answer": {
      if (state.phase !== "answer") {
        return { ok: false, error: "いまは回答できません。" };
      }
      const text = typeof move.text === "string" ? move.text : "";
      if (!text.trim() || text.length > MAX_ANSWER_LENGTH) {
        return { ok: false, error: "回答を入力してください。" };
      }
      return { ok: true, state: submitAnswer(state, text) };
    }
    case "pass":
      if (state.phase !== "answer") {
        return { ok: false, error: "いまは回答できません。" };
      }
      return { ok: true, state: passAnswer(state) };
    case "open": {
      if (state.phase !== "open") {
        return { ok: false, error: "いまは文字を開けません。" };
      }
      const char = typeof move.char === "string" ? move.char : "";
      if (!getBoardOrder(state.question.language).includes(char)) {
        return { ok: false, error: "その文字は盤面にありません。" };
      }
      if (state.openedChars.includes(char)) {
        return { ok: false, error: "その文字はすでに開いています。" };
      }
      return { ok: true, state: openCharacter(state, char) };
    }
    default:
      return { ok: false, error: "不明な操作です。" };
  }
}

// Ends the game in favour of the other player, for a timeout or a player
// leaving mid-game.
export function concedeGame(
  state: GameState,
  loser: PlayerIndex,
  reason: "timeout" | "forfeit",
): GameState {
  const winner: PlayerIndex = loser === 0 ? 1 : 0;
  const message =
    reason === "timeout"
      ? `Player ${loser + 1} の持ち時間が切れました。Player ${winner + 1} の勝ち！`
      : `Player ${loser + 1} が退出しました。Player ${winner + 1} の勝ち！`;

  return { ...state, phase: "finished", winner, lastMessage: message };
}
