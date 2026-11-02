import type { Question } from "../data/types";
import { QUESTIONS } from "../data/questions";
import { consistentCandidates, samePromptPool } from "../daily/puzzle";
import rawPack from "./pack-ja.json";

// One 詰め五十音 puzzle, written by scripts/puzzles/build.ts.
export type PuzzleEntry = {
  id: string;
  questionId: string;
  opened: string[];
  // The fewest cells that settle the answer, however they turn out.
  par: number;
  // How many words of the prompt fit the starting board.
  words: number;
  // The cells to open first that keep to par (for the explanation).
  firstCells: string[];
};

export const PUZZLE_PACK = rawPack as PuzzleEntry[];

export function puzzleQuestion(entry: PuzzleEntry): Question {
  const question = QUESTIONS.find((item) => item.id === entry.questionId);
  if (!question) throw new Error(`Unknown question ${entry.questionId}`);
  return question;
}

// The words of the prompt that fit the board.
export function fittingWords(
  entry: PuzzleEntry,
  opened: readonly string[] = entry.opened,
): Question[] {
  const question = puzzleQuestion(entry);
  return consistentCandidates(
    question,
    samePromptPool(question, QUESTIONS),
    opened,
  );
}
