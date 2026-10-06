import type { Question } from "../data/types";
import { primaryAnswer } from "../data/questions";
import { adjacentCharacters } from "./board";
import { normalizeValue } from "./normalize";
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

function rawComparable(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase();
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
  return mineCharacters(primaryAnswer(question).value, question.language);
}

export function isMineCharacter(question: Question, char: string): boolean {
  return questionMineCharacters(question).has(char);
}

export function adjacentMineCount(question: Question, char: string): number {
  const mines = questionMineCharacters(question);

  return adjacentCharacters(question.language, char).filter((neighbor) =>
    mines.has(neighbor),
  ).length;
}

export function isAcceptedAnswer(question: Question, input: string): boolean {
  const rawInput = rawComparable(input);
  const normalizedInput = normalizeValue(input, question.language);

  if (!rawInput) {
    return false;
  }

  return question.answers.some((answer) => {
    if (
      answer.aliases.some(
        (alias) => rawComparable(alias) === rawInput,
      )
    ) {
      return true;
    }

    return (
      normalizedInput.length > 0 &&
      normalizeValue(answer.value, question.language) === normalizedInput
    );
  });
}

export function validateQuestionCollision(question: Question): boolean {
  if (question.answers.length <= 1) {
    return true;
  }

  const expected = createSignatureKey(
    primaryAnswer(question).value,
    question.language,
  );

  return question.answers.every(
    (answer) =>
      createSignatureKey(answer.value, question.language) === expected,
  );
}

function expandZeroArea(
  question: Question,
  startChar: string,
  alreadyOpened: ReadonlySet<string>,
): string[] {
  const mines = questionMineCharacters(question);
  const opened = new Set(alreadyOpened);
  const newlyOpened = new Set<string>();
  const queue = [startChar];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || opened.has(current) || mines.has(current)) {
      continue;
    }

    opened.add(current);
    newlyOpened.add(current);

    if (adjacentMineCount(question, current) !== 0) {
      continue;
    }

    for (const neighbor of adjacentCharacters(question.language, current)) {
      if (!opened.has(neighbor) && !mines.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return [...newlyOpened];
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
    lastMessage: "不正解。盤面から1文字開けてください。",
  };
}

export function passAnswer(state: GameState): GameState {
  if (state.phase !== "answer" || state.winner !== null) {
    return state;
  }

  return {
    ...state,
    phase: "open",
    lastMessage: "回答をパスしました。盤面から1文字開けてください。",
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

  const alreadyOpened = new Set(state.openedChars);
  const newlyOpened = hitMine
    ? [char]
    : expandZeroArea(state.question, char, alreadyOpened);
  const openedChars = [...state.openedChars, ...newlyOpened];

  const nextPlayer: PlayerIndex = state.currentPlayer === 0 ? 1 : 0;
  const nextPlayerBlocked = blocked[nextPlayer];

  if (nextPlayerBlocked) {
    blocked[nextPlayer] = false;
  }

  let resultMessage: string;

  if (hitMine) {
    resultMessage = `「${char}」は地雷！ ${playerName(state.currentPlayer)} は次回の回答権なし。`;
  } else {
    const count = adjacentMineCount(state.question, char);
    const chainCount = Math.max(0, newlyOpened.length - 1);

    resultMessage =
      count === 0 && chainCount > 0
        ? `「${char}」の周囲は地雷0個。周辺${chainCount}マスも開きました。`
        : `「${char}」はセーフ。周囲の地雷は${count}個。`;
  }

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
