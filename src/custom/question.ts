import type { Question, QuestionLanguage } from "../data/types";
import { normalizeEnglish, normalizeKana } from "../game/normalize";
import { createSignatureKey } from "../game/signature";

// A question from a word someone typed in for a friend to guess.
export type CustomInput = {
  language: QuestionLanguage;
  // How the word is written (kanji is fine); shown at the end.
  display: string;
  // Japanese: the reading in kana, which makes the mines. English: the
  // word itself.
  reading: string;
  // What the guesser is told, like "食べ物". Optional.
  hint: string;
};

export type CustomProblem =
  "empty" | "notKana" | "notLetters" | "tooShort" | "tooLong";

export const MIN_LENGTH = 2;
export const MAX_LENGTH = 12;

// Characters in the reading that are not on the board (kanji, digits...).
// Spaces and the separators people type between words are let through.
function offBoard(input: CustomInput): string[] {
  const normalize = input.language === "ja" ? normalizeKana : normalizeEnglish;
  return Array.from(input.reading.normalize("NFKC")).filter(
    (char) => !/[\s・\-'’.]/.test(char) && normalize(char) === "",
  );
}

export function checkCustom(input: CustomInput): CustomProblem | null {
  if (!input.reading.trim()) return "empty";
  if (offBoard(input).length > 0) {
    return input.language === "ja" ? "notKana" : "notLetters";
  }
  const letters = Array.from(
    input.language === "ja"
      ? normalizeKana(input.reading)
      : normalizeEnglish(input.reading),
  ).length;
  if (letters < MIN_LENGTH) return "tooShort";
  if (letters > MAX_LENGTH) return "tooLong";
  return null;
}

export function buildCustomQuestion(input: CustomInput): Question | null {
  if (checkCustom(input)) return null;
  const value = input.reading.trim();
  const display = input.display.trim() || value;
  const normalized =
    input.language === "ja" ? normalizeKana(value) : normalizeEnglish(value);
  return {
    id: "custom",
    language: input.language,
    category: input.hint.trim(),
    length: Array.from(normalized).length,
    signature: createSignatureKey(value, input.language),
    answers: [{ display, value, aliases: [...new Set([display, value])] }],
  };
}
