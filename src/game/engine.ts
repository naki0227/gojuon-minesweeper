import type { Question } from "../data/questions";
import { primaryAnswer } from "../data/questions";
import { normalizeKana } from "./normalize";
import { createSignatureKey, mineCharacters } from "./signature";

export type PlayerIndex = 0 | 1;
export type GamePhase = "answer" | "open" | "finished";

export type GameState = {
  question: Question;
  currentPlayer: PlayerIndex;
  phase: GamePhase;
  openedChars: readonly string[];
  answerBlocked: readonly [boolean, boolean];
  winner: PlayerIndex | null;
  lastMessage: string;
};

function playerName(player: PlayerIndex): string {
  return `Player ${player + 1}`;
}

export function createInitialState(question: Question): GameState {
  return {
    question,
    currentPlayer: 0,
    phase: "answer",
    openedChars: [],
    answerBlocked: [false, false],
    winner: null,
    lastMessage: "Player 1 からスタート。まず答えを予想してください。",
  };
}

export function questionMineCharacters(question: Question): Set<string> {
  return mineCharacters(primaryAnswer(question));
}

export function isMineCharacter(question: Question, char: string): boolean {
  return questionMineCharacters(question).has(char);
}

export function isAcceptedAnswer(question: Question, input: string): boolean {
  const normalizedInput = normalizeKana(input);

  if (!normalizedInput) {
    return false;
  }

  return question.answers.some(
    (answer) => normalizeKana(answer) === normalizedInput,
  );
}

export function validateQuestionCollision(question: Question): boolean {
  if (question.answers.length <= 1) {
    return true;
  }

  const expected = createSignatureKey(primaryAnswer(question));
  return question.answers.every(
    (answer) => createSignatureKey(answer) === expected,
  );
}

export function submitAnswer(state: GameState, input: string): GameState {
  if (state.phase !== "answer" || state.winner !== null) {
    return state;
  }

  if (isAcceptedAnswer(state.question, input)) {
    return {
      ...state,
      phase: "finished",
      winner: state.currentPlayer,
      lastMessage: `${playerName(state.currentPlayer)} 正解！`,
    };
  }

  return {
    ...state,
    phase: "open",
    lastMessage: "不正解。五十音表から1文字開けてください。",
  };
}

export function passAnswer(state: GameState): GameState {
  if (state.phase !== "answer" || state.winner !== null) {
    return state;
  }

  return {
    ...state,
    phase: "open",
    lastMessage: "回答をパスしました。五十音表から1文字開けてください。",
  };
}

export function openCharacter(state: GameState, char: string): GameState {
  if (state.phase !== "open" || state.winner !== null) {
    return state;
  }

  if (state.openedChars.includes(char)) {
    return {
      ...state,
      lastMessage: "その文字はすでに開いています。",
    };
  }

  const hitMine = isMineCharacter(state.question, char);
  const blocked: [boolean, boolean] = [
    state.answerBlocked[0],
    state.answerBlocked[1],
  ];

  if (hitMine) {
    blocked[state.currentPlayer] = true;
  }

  const nextPlayer: PlayerIndex = state.currentPlayer === 0 ? 1 : 0;
  const nextPlayerBlocked = blocked[nextPlayer];

  if (nextPlayerBlocked) {
    blocked[nextPlayer] = false;
  }

  const openedChars = [...state.openedChars, char];

  const resultMessage = hitMine
    ? `「${char}」は地雷！ ${playerName(state.currentPlayer)} は次回の回答権なし。`
    : `「${char}」はセーフ。`;

  return {
    ...state,
    currentPlayer: nextPlayer,
    phase: nextPlayerBlocked ? "open" : "answer",
    openedChars,
    answerBlocked: blocked,
    lastMessage: nextPlayerBlocked
      ? `${resultMessage} ${playerName(nextPlayer)} は回答なしで1文字開けてください。`
      : `${resultMessage} ${playerName(nextPlayer)} のターンです。`,
  };
}
