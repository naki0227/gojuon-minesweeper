import type { Question } from "../data/types";
import { adjacentCharacters, getBoardOrder } from "../game/board";
import {
  adjacentMineCount,
  isAcceptedAnswer,
  isMineCharacter,
  questionMineCharacters,
} from "../game/engine";

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
export const GEM_PACK_SIZE = 10;
export const GEM_PACK_PRICE_YEN = 200;
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
    totalOpenedMoves: 0,
    totalMineHits: 0,
    chainBonus: 0,
    lastChainBonus: 0,
    revives: 0,
    message: "答えを予想するか、回答をパスしてマスを開こう。",
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
      state.hintUses * 20,
  );
}

export function guessEndless(state: EndlessState, input: string): EndlessState {
  if (state.phase !== "answer" || !input.trim()) return state;
  if (isAcceptedAnswer(state.question, input)) {
    const earned = questionScore(state);
    const bonus = difficultyBonus(state.question);
    const bonusNote =
      bonus > 0
        ? `（難易度ボーナス +${bonus}）`
        : bonus < 0
          ? `（易しめ ${bonus}）`
          : "";
    return {
      ...state,
      score: state.score + earned,
      solved: state.solved + 1,
      phase: "cleared",
      message: `正解！ +${earned}点${bonusNote}。次の問題に進もう。`,
    };
  }
  return {
    ...state,
    wrongGuesses: state.wrongGuesses + 1,
    phase: "open",
    message: "不正解。1文字開けてヒントを探そう。",
  };
}

export function passEndless(state: EndlessState): EndlessState {
  return state.phase === "answer"
    ? { ...state, phase: "open", message: "安全だと思うマスを1つ開けよう。" }
    : state;
}

function expandSafe(
  question: Question,
  first: string,
  opened: readonly string[],
): string[] {
  const seen = new Set(opened);
  const queue = [first];
  const additions: string[] = [];
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i];
    if (!current || seen.has(current) || isMineCharacter(question, current))
      continue;
    seen.add(current);
    additions.push(current);
    if (adjacentMineCount(question, current) === 0) {
      queue.push(...adjacentCharacters(question.language, current));
    }
  }
  return additions;
}

export function openEndless(state: EndlessState, char: string): EndlessState {
  if (state.phase !== "open" || state.opened.includes(char)) return state;
  if (!getBoardOrder(state.question.language).includes(char)) return state;
  const mine = isMineCharacter(state.question, char);
  const expanded = mine
    ? [char]
    : expandSafe(state.question, char, state.opened);
  const lives = state.lives - (mine ? 1 : 0);
  const chainBonus = Math.max(0, expanded.length - 1) * CHAIN_BONUS_PER_CELL;
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
        ? "ライフがなくなった！ 復活するか記録を確定しよう。"
        : mine
          ? "地雷！ ライフが1つ減った。"
          : expanded.length > 1
            ? `CHAIN +${chainBonus}点！ 周囲の${expanded.length - 1}マスも開いた。`
            : "安全！ 数字を手掛かりに次の答えを考えよう。",
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
    message: `「${char}」は安全。開くと数字が確認できるよ。`,
  };
}

export function reviveEndless(state: EndlessState): EndlessState {
  if (state.phase !== "revive") return state;
  const resumed = {
    ...state,
    lives: 2,
    revives: state.revives + 1,
    phase: "answer" as const,
    message: "復活！ ライフ2つと安全マスのヒントを獲得。",
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
    lastChainBonus: 0,
    message: "次の問題！ 少ない手数・被弾で正解を目指そう。",
  };
}

export function endEndless(state: EndlessState): EndlessState {
  return state.phase === "revive"
    ? { ...state, phase: "finished", message: "ゲームオーバー！" }
    : state;
}
