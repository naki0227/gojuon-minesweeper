import type { Question } from "../data/types";
import { getBoardOrder } from "../game/board";
import {
  adjacentMineCount,
  expandZeroArea,
  isMineCharacter,
  questionMineMultiplicity,
} from "../game/engine";

// A daily puzzle is a board with some cells already open: enough that the
// answer can be reasoned out from the numbers, not so many that it is
// given away.
export type PuzzleOptions = {
  // Stop once at most this many words of the same prompt fit the board.
  maxCandidates: number;
  // Never stop before this many cells are open...
  minOpened: number;
  // ...and give up on the question past this many.
  maxOpened: number;
  // Answer letters shown as opened mines, at most.
  letterHints: number;
};

export const DEFAULT_PUZZLE_OPTIONS: PuzzleOptions = {
  maxCandidates: 3,
  minOpened: 8,
  maxOpened: 20,
  letterHints: 2,
};

// Words with the same prompt (language, category, length): what a player
// could guess from the title alone. One entry per distinct word.
export function samePromptPool(
  target: Question,
  questions: readonly Question[],
): Question[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (
      question.language !== target.language ||
      question.category !== target.category ||
      question.length !== target.length ||
      seen.has(question.signature)
    ) {
      return false;
    }
    seen.add(question.signature);
    return true;
  });
}

// What an open cell shows: a number for a safe cell, the letter's count
// in the answer for a mine.
function cellView(question: Question, char: string): string {
  return isMineCharacter(question, char)
    ? `m${questionMineMultiplicity(question, char)}`
    : `s${adjacentMineCount(question, char)}`;
}

// The words in `pool` that would show exactly the same open cells.
export function consistentCandidates(
  target: Question,
  pool: readonly Question[],
  opened: readonly string[],
): Question[] {
  const views = opened.map((char) => cellView(target, char));
  return pool.filter((candidate) =>
    opened.every((char, i) => cellView(candidate, char) === views[i]),
  );
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

// Shows a few answer letters (opened mines) first, then opens safe cells
// in a random order (with the game's zero chains) until the board narrows
// the answer down. Returns null for a question that can't be made into a
// fair puzzle.
export function buildPuzzle(
  target: Question,
  pool: readonly Question[],
  random: () => number,
  options: PuzzleOptions = DEFAULT_PUZZLE_OPTIONS,
): string[] | null {
  const order = getBoardOrder(target.language);
  const safe = shuffled(
    order.filter((char) => !isMineCharacter(target, char)),
    random,
  );
  const mines = shuffled(
    order.filter((char) => isMineCharacter(target, char)),
    random,
  );
  // Leave most of the answer to work out: at most a third of its letters.
  const opened = mines.slice(
    0,
    Math.min(options.letterHints, Math.floor(mines.length / 3)),
  );

  for (const char of safe) {
    if (opened.includes(char)) continue;
    opened.push(...expandZeroArea(target, char, opened));
    if (opened.length > options.maxOpened) return null;
    if (
      opened.length >= options.minOpened &&
      consistentCandidates(target, pool, opened).length <= options.maxCandidates
    ) {
      return opened;
    }
  }
  return null;
}
