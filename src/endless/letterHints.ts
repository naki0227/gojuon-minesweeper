import { primaryAnswer } from "../data/questions";
import type { Question } from "../data/types";
import { getBoardOrder } from "../game/board";
import { questionMineCharacters } from "../game/engine";
import { normalizeValue } from "../game/normalize";

// Points taken from the question for each answer letter shown.
export const LETTER_HINT_PENALTY = 25;

export function answerLetters(question: Question): string[] {
  return Array.from(
    normalizeValue(primaryAnswer(question).value, question.language),
  );
}

// Every safe cell is open, so only mines are left to open.
export function isBoardExhausted(
  question: Question,
  opened: readonly string[],
): boolean {
  const open = new Set(opened);
  const mines = questionMineCharacters(question);
  return getBoardOrder(question.language).every(
    (char) => mines.has(char) || open.has(char),
  );
}

// "う？？" with the first `revealed` letters shown.
export function letterHint(question: Question, revealed: number): string {
  return answerLetters(question)
    .map((char, index) => (index < revealed ? char : "？"))
    .join("");
}
