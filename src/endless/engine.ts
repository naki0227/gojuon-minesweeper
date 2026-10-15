import type { Question } from "../data/types";
import { getBoardOrder } from "../game/board";
import {
  allSafeCellsOpen,
  answerCharacters,
  expandZeroArea,
  isAcceptedAnswer,
  isMineCharacter,
  questionMineCharacters,
} from "../game/engine";
import { ENDLESS_MESSAGES as M } from "./engine.strings";

// Points taken from the question for each answer letter shown.
export const LETTER_HINT_PENALTY = 25;

export type EndlessPhase =
  "answer" | "open" | "cleared" | "revive" | "finished";

export type EndlessState = {
  question: Question;
  phase: EndlessPhase;
  lives: number;
  score: number;
  solved: number;
  opened: readonly string[];
  hints: readonly string[];
  openedMoves: number;
  mineHits: number;
  wrongGuesses: number;
  hintUses: number;
  // Answer letters shown after every safe cell was opened.
  revealedLetters: number;
  totalOpenedMoves: number;
  totalMineHits: number;
  chainBonus: number;
  lastChainBonus: number;
  revives: number;
  message: string;
};

export const FREE_REVIVE_LIMIT = 3;
export const HINT_CREDIT_COST = 1;
export const REVIVE_CREDIT_COST = 3;
export const CHAIN_BONUS_PER_CELL = 3;

// Difficulty is anchored on the most common question shape (4 characters,
// 4 distinct mines), which keeps the classic 200-point base.
export const BASE_QUESTION_SCORE = 200;
export const DIFFICULTY_ANCHOR = 4;
export const LENGTH_BONUS_PER_CHAR = 12;
export const MINE_BONUS_PER_TYPE = 12;
export const MIN_DIFFICULTY_BONUS = -60;
// The longest questions (15 characters, 14 mine types) earn +252; the cap
// only guards against unexpected data.
export const MAX_DIFFICULTY_BONUS = 300;

export function startEndless(question: Question): EndlessState {
  return {
    question,
    phase: "answer",
    lives: 3,
    score: 0,
    solved: 0,
    opened: [],
    hints: [],
    openedMoves: 0,
    mineHits: 0,
    wrongGuesses: 0,
    hintUses: 0,
    revealedLetters: 0,
    totalOpenedMoves: 0,
    totalMineHits: 0,
    chainBonus: 0,
    lastChainBonus: 0,
    revives: 0,
    message: M.start,
  };
}

// Longer answers are harder to guess, and more distinct mine letters make
// the board more dangerous; both raise the base. Penalties stay fixed so a
// mistake costs the same on every question.
export function difficultyBonus(question: Question): number {
  const mineTypes = questionMineCharacters(question).size;
  const raw =
    (question.length - DIFFICULTY_ANCHOR) * LENGTH_BONUS_PER_CHAR +
    (mineTypes - DIFFICULTY_ANCHOR) * MINE_BONUS_PER_TYPE;
  return Math.min(MAX_DIFFICULTY_BONUS, Math.max(MIN_DIFFICULTY_BONUS, raw));
}

// Only deliberate opens count as moves; a zero-cell flood counts as one.
export function questionScore(state: EndlessState): number {
  return Math.max(
    10,
    BASE_QUESTION_SCORE +
      difficultyBonus(state.question) -
      state.openedMoves * 6 -
      state.mineHits * 30 -
      state.wrongGuesses * 12 -
      state.hintUses * 20 -
      state.revealedLetters * LETTER_HINT_PENALTY,
  );
}

// With no safe cell left to open, a wrong answer or a pass shows the next
// answer letter instead, as in two-player games, for a score penalty.
function revealLetter(state: EndlessState, lead: string): EndlessState {
  const total = answerCharacters(state.question).length;
  const revealedLetters = Math.min(total, state.revealedLetters + 1);
  const shown = revealedLetters > state.revealedLetters;
  return {
    ...state,
    phase: "answer",
    revealedLetters,
    message: !shown
      ? M.allShown(lead)
      : M.letterShown(lead, revealedLetters, LETTER_HINT_PENALTY),
  };
}

export function isExhausted(state: EndlessState): boolean {
  return allSafeCellsOpen(state.question, state.opened);
}

export function guessEndless(state: EndlessState, input: string): EndlessState {
  if (state.phase !== "answer" || !input.trim()) return state;
  if (isAcceptedAnswer(state.question, input)) {
    const earned = questionScore(state);
    const bonus = difficultyBonus(state.question);
    const bonusNote =
      bonus > 0
        ? M.difficultyBonus(bonus)
        : bonus < 0
          ? M.easyPenalty(bonus)
          : "";
    return {
      ...state,
      score: state.score + earned,
      solved: state.solved + 1,
      phase: "cleared",
      message: M.correct(earned, bonusNote),
    };
  }
  const wrong = { ...state, wrongGuesses: state.wrongGuesses + 1 };
  if (isExhausted(state)) return revealLetter(wrong, M.wrong);
  return {
    ...wrong,
    phase: "open",
    message: M.wrongOpen,
  };
}

export function passEndless(state: EndlessState): EndlessState {
  if (state.phase !== "answer") return state;
  if (isExhausted(state)) return revealLetter(state, "");
  return {
    ...state,
    phase: "open",
    message: M.pass,
  };
}

export function openEndless(state: EndlessState, char: string): EndlessState {
  if (state.phase !== "open" || state.opened.includes(char)) return state;
  if (!getBoardOrder(state.question.language).includes(char)) return state;
  const mine = isMineCharacter(state.question, char);
  const expanded = mine
    ? [char]
    : expandZeroArea(state.question, char, state.opened);
  const lives = state.lives - (mine ? 1 : 0);
  const chainBonus = Math.max(0, expanded.length - 1) * CHAIN_BONUS_PER_CELL;
  const exhausted =
    !mine && allSafeCellsOpen(state.question, [...state.opened, ...expanded]);
  return {
    ...state,
    opened: [...state.opened, ...expanded],
    openedMoves: state.openedMoves + 1,
    totalOpenedMoves: state.totalOpenedMoves + 1,
    mineHits: state.mineHits + (mine ? 1 : 0),
    totalMineHits: state.totalMineHits + (mine ? 1 : 0),
    lives,
    score: state.score + chainBonus,
    chainBonus: state.chainBonus + chainBonus,
    lastChainBonus: chainBonus,
    phase: lives === 0 ? "revive" : "answer",
    message:
      lives === 0
        ? M.outOfLives
        : mine
          ? M.mine
          : exhausted
            ? M.exhausted(LETTER_HINT_PENALTY)
            : expanded.length > 1
              ? M.chain(chainBonus, expanded.length - 1)
              : M.safe,
  };
}

export function safeHintCandidate(state: EndlessState): string | null {
  return (
    getBoardOrder(state.question.language).find(
      (char) =>
        !state.opened.includes(char) &&
        !state.hints.includes(char) &&
        !isMineCharacter(state.question, char),
    ) ?? null
  );
}

export function grantHint(state: EndlessState): EndlessState {
  if (state.phase !== "answer" && state.phase !== "open") return state;
  const char = safeHintCandidate(state);
  if (!char) return state;
  return {
    ...state,
    hints: [...state.hints, char],
    hintUses: state.hintUses + 1,
    message: M.hint(char),
  };
}

export function reviveEndless(state: EndlessState): EndlessState {
  if (state.phase !== "revive") return state;
  const resumed = {
    ...state,
    lives: 2,
    revives: state.revives + 1,
    phase: "answer" as const,
    message: M.revived,
  };
  const hint = safeHintCandidate(resumed);
  return hint ? { ...resumed, hints: [...resumed.hints, hint] } : resumed;
}

export function nextEndlessQuestion(
  state: EndlessState,
  question: Question,
): EndlessState {
  if (state.phase !== "cleared") return state;
  return {
    ...state,
    question,
    phase: "answer",
    opened: [],
    hints: [],
    openedMoves: 0,
    mineHits: 0,
    wrongGuesses: 0,
    hintUses: 0,
    revealedLetters: 0,
    lastChainBonus: 0,
    message: M.next,
  };
}

export function endEndless(state: EndlessState): EndlessState {
  return state.phase === "revive"
    ? { ...state, phase: "finished", message: M.gameOver }
    : state;
}
