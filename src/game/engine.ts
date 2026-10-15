import type { Question } from "../data/types";
import { primaryAnswer } from "../data/questions";
import { adjacentCharacters, getBoardOrder } from "./board";
import { normalizeValue } from "./normalize";
import { joined, MSG, say, type Said } from "./messages";
import {
  createCountMap,
  createSignatureKey,
  mineCharacters,
} from "./signature";

export type PlayerIndex = 0 | 1;
export type GamePhase = "answer" | "open" | "finished";

export type GameState = {
  question: Question;
  currentPlayer: PlayerIndex;
  phase: GamePhase;
  openedChars: readonly string[];
  answerBlocked: readonly [boolean, boolean];
  finalAnswerAttempts: readonly [boolean, boolean];
  revealedAnswerChars: number;
  winner: PlayerIndex | null;
  // The latest event (see messages.ts); 1.0.1 apps read only lastMessage.
  lastMessage: string;
  lastMessageEn: string;
};

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
    finalAnswerAttempts: [false, false],
    revealedAnswerChars: 0,
    winner: null,
    ...say(MSG.start),
  };
}

export function questionMineCharacters(question: Question): Set<string> {
  return mineCharacters(primaryAnswer(question).value, question.language);
}

export function isMineCharacter(question: Question, char: string): boolean {
  return questionMineCharacters(question).has(char);
}

export function questionMineMultiplicity(
  question: Question,
  char: string,
): number {
  return (
    createCountMap(primaryAnswer(question).value, question.language).get(
      char,
    ) ?? 0
  );
}

export function adjacentMineCount(question: Question, char: string): number {
  const mines = createCountMap(
    primaryAnswer(question).value,
    question.language,
  );

  return adjacentCharacters(question.language, char).reduce(
    (total, neighbor) => total + (mines.get(neighbor) ?? 0),
    0,
  );
}

export function isAcceptedAnswer(question: Question, input: string): boolean {
  const rawInput = rawComparable(input);
  const normalizedInput = normalizeValue(input, question.language);

  if (!rawInput) {
    return false;
  }

  return question.answers.some((answer) => {
    if (answer.aliases.some((alias) => rawComparable(alias) === rawInput)) {
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

// Every safe cell is open, so only mines are left to open.
export function allSafeCellsOpen(
  question: Question,
  opened: Iterable<string>,
): boolean {
  const open = new Set(opened);
  const mines = questionMineCharacters(question);
  return getBoardOrder(question.language).every(
    (char) => mines.has(char) || open.has(char),
  );
}

export function answerCharacters(question: Question): string[] {
  return Array.from(
    normalizeValue(primaryAnswer(question).value, question.language),
  );
}

// "う？？" with the first `revealed` letters shown.
export function maskedAnswer(question: Question, revealed: number): string {
  return answerCharacters(question)
    .map((char, index) => (index < revealed ? char : "？"))
    .join("");
}

export function answerHint(state: GameState): string {
  return maskedAnswer(state.question, state.revealedAnswerChars);
}

function finishHintTurn(state: GameState, message: Said): GameState {
  const attempted: [boolean, boolean] = [...state.finalAnswerAttempts];
  attempted[state.currentPlayer] = true;
  const other: PlayerIndex = state.currentPlayer === 0 ? 1 : 0;

  if (!attempted[other]) {
    return {
      ...state,
      currentPlayer: other,
      finalAnswerAttempts: attempted,
      ...say(joined(message, MSG.toAnswer(other))),
    };
  }

  const nextRevealed = state.revealedAnswerChars + 1;
  const answerChars = answerCharacters(state.question);
  const nextChar = answerChars[nextRevealed - 1];
  const openedChars =
    nextChar && !state.openedChars.includes(nextChar)
      ? [...state.openedChars, nextChar]
      : state.openedChars;
  if (nextRevealed >= answerChars.length) {
    return {
      ...state,
      phase: "finished",
      finalAnswerAttempts: attempted,
      revealedAnswerChars: nextRevealed,
      openedChars,
      ...say(joined(message, MSG.draw)),
    };
  }

  return {
    ...state,
    currentPlayer: other,
    finalAnswerAttempts: [false, false],
    revealedAnswerChars: nextRevealed,
    openedChars,
    ...say(joined(message, MSG.nextLetter(other))),
  };
}

// Opens `startChar` and, while the opened cell touches no mine, its
// neighbors too. Returns only the newly opened cells, in BFS order.
export function expandZeroArea(
  question: Question,
  startChar: string,
  alreadyOpened: Iterable<string>,
): string[] {
  const mines = questionMineCharacters(question);
  const seen = new Set(alreadyOpened);
  const queue = [startChar];
  const newlyOpened: string[] = [];
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i]!;
    if (seen.has(current) || mines.has(current)) continue;
    seen.add(current);
    newlyOpened.push(current);
    if (adjacentMineCount(question, current) === 0) {
      queue.push(...adjacentCharacters(question.language, current));
    }
  }
  return newlyOpened;
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
      ...say(MSG.correct(state.currentPlayer)),
    };
  }

  if (allSafeCellsOpen(state.question, state.openedChars)) {
    return finishHintTurn(state, MSG.wrong);
  }

  return {
    ...state,
    phase: "open",
    ...say(MSG.wrongOpen),
  };
}

export function passAnswer(state: GameState): GameState {
  if (state.phase !== "answer" || state.winner !== null) {
    return state;
  }

  if (allSafeCellsOpen(state.question, state.openedChars)) {
    return finishHintTurn(state, MSG.passed);
  }

  return {
    ...state,
    phase: "open",
    ...say(MSG.passedOpen),
  };
}

export function openCharacter(state: GameState, char: string): GameState {
  if (state.phase !== "open" || state.winner !== null) {
    return state;
  }

  if (state.openedChars.includes(char)) {
    return {
      ...state,
      ...say(MSG.alreadyOpen),
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

  let resultMessage: Said;

  if (hitMine) {
    const multiplicity = questionMineMultiplicity(state.question, char);
    resultMessage = MSG.mine(char, multiplicity, state.currentPlayer);
  } else {
    const count = adjacentMineCount(state.question, char);
    const chainCount = Math.max(0, newlyOpened.length - 1);

    resultMessage =
      count === 0 && chainCount > 0
        ? MSG.chain(char, chainCount)
        : MSG.safe(char, count);
  }

  const boardComplete = allSafeCellsOpen(state.question, openedChars);
  if (boardComplete) {
    const answerChars = answerCharacters(state.question);
    const ending =
      answerChars.length <= 1 ? MSG.draw : MSG.firstLetter(nextPlayer);
    const firstChar = answerChars[0];
    const revealedBoard =
      firstChar && !openedChars.includes(firstChar)
        ? [...openedChars, firstChar]
        : openedChars;
    return {
      ...state,
      currentPlayer: nextPlayer,
      phase: answerChars.length <= 1 ? "finished" : "answer",
      openedChars: revealedBoard,
      answerBlocked: [false, false],
      finalAnswerAttempts: [false, false],
      revealedAnswerChars: 1,
      ...say(joined(resultMessage, ending)),
    };
  }

  if (nextPlayerBlocked) {
    blocked[nextPlayer] = false;
  }

  return {
    ...state,
    currentPlayer: nextPlayer,
    phase: nextPlayerBlocked ? "open" : "answer",
    openedChars,
    answerBlocked: blocked,
    ...say(joined(resultMessage, MSG.nextTurn(nextPlayer, nextPlayerBlocked))),
  };
}
