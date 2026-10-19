// One puzzle of the chat-played live stream. Viewers comment a single kana
// to open that cell, or a word to answer. Pure, so the rules can be tested
// without a stream.
import { questionPrompt } from "../../src/data/questions";
import type { Question } from "../../src/data/types";
import {
  adjacentMineCount,
  allSafeCellsOpen,
  answerCharacters,
  expandZeroArea,
  isAcceptedAnswer,
  isMineCharacter,
} from "../../src/game/engine";
import { normalizeKana } from "../../src/game/normalize";

export type Round = {
  question: Question;
  opened: readonly string[];
  solvedBy: string | null;
};

export type RoundEvent =
  | { kind: "open"; name: string; char: string; mine: boolean; count: number }
  | { kind: "wrong"; name: string; guess: string }
  | { kind: "solved"; name: string; points: number }
  | { kind: "none" };

export function newRound(question: Question): Round {
  return { question, opened: [], solvedBy: null };
}

// Names are shown on screen and passed to the host, so they are cut short.
export function displayName(name: string): string {
  const clean = name.normalize("NFKC").replace(/\s+/g, " ").trim();
  const chars = Array.from(clean || "名無し");
  return chars.length > 12 ? `${chars.slice(0, 12).join("")}…` : chars.join("");
}

// Fewer open cells, more points: 10 down to 1.
export function pointsFor(round: Round): number {
  return Math.max(1, 10 - Math.floor(round.opened.length / 4));
}

export function isBoardDone(round: Round): boolean {
  return allSafeCellsOpen(round.question, round.opened);
}

function cellOf(text: string): string | null {
  if (Array.from(text).length > 2) return null;
  const kana = normalizeKana(text);
  return Array.from(kana).length === 1 ? kana : null;
}

// A word counts as a guess when it is marked 「答え：」 or has the answer's
// length, so chat like 「こんばんは」 on a 4-letter puzzle is left alone.
function guessOf(round: Round, text: string): string | null {
  const marked = /^答え?\s*[:：は]/.test(text);
  const guess = text.replace(/^答え?\s*[:：は]?\s*/, "").trim();
  const length = Array.from(normalizeKana(guess)).length;
  if (length < 2) return null;
  return marked || length === answerLength(round) ? guess : null;
}

export function applyComment(
  round: Round,
  rawName: string,
  rawText: string,
): { round: Round; event: RoundEvent } {
  const none = { round, event: { kind: "none" } as const };
  if (round.solvedBy !== null) return none;
  const name = displayName(rawName);
  const text = rawText.normalize("NFKC").trim();

  const cell = cellOf(text);
  if (cell !== null) {
    if (round.opened.includes(cell)) return none;
    const mine = isMineCharacter(round.question, cell);
    const added = mine
      ? [cell]
      : expandZeroArea(round.question, cell, round.opened);
    return {
      round: { ...round, opened: [...round.opened, ...added] },
      event: {
        kind: "open",
        name,
        char: cell,
        mine,
        count: mine ? 0 : adjacentMineCount(round.question, cell),
      },
    };
  }

  const guess = guessOf(round, text);
  if (guess === null) return none;
  if (!isAcceptedAnswer(round.question, guess)) {
    return {
      round,
      event: {
        kind: "wrong",
        name,
        guess: Array.from(guess).slice(0, 12).join(""),
      },
    };
  }
  return {
    round: { ...round, solvedBy: name },
    event: { kind: "solved", name, points: pointsFor(round) },
  };
}

export function roundPrompt(round: Round): string {
  return questionPrompt(round.question);
}

export function answerLength(round: Round): number {
  return answerCharacters(round.question).length;
}
