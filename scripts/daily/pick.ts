// Choosing a day's question, shared by the weekly plan (plan.ts, seeded
// from the key) and the days this session plans (incoming.ts, seeded at
// random).
import { QUESTIONS } from "../../src/data/questions";
import type { Question } from "../../src/data/types";
import { isSpecialistCategory } from "../../src/data/specialistCategories";
import { buildPuzzle, samePromptPool } from "../../src/daily/puzzle";
import { seededRandom } from "../../src/daily/random";
import type { DailyEntry } from "../../src/daily/schedule";

// Planned for 2026-10-28 to 11-08 while the repository was private; the
// plan became readable when it went public, so these are never used.
export const LEAKED = [
  "jam-04966",
  "jam-00709",
  "jam-13609",
  "daily-ja-08-11",
  "jam-12802",
  "jam-02590",
  "jam-01566",
  "jam-13544",
  "jam-13458",
  "jam-12432",
  "jam-07443",
  "jam-04573",
];

export const ELIGIBLE: readonly Question[] = QUESTIONS.filter(
  (question) =>
    question.language === "ja" &&
    question.length >= 4 &&
    question.length <= 6 &&
    !isSpecialistCategory(question.category),
);

// The first question in a random order that is unused and makes a fair
// puzzle, or null.
export function pickDay(
  date: string,
  used: ReadonlySet<string>,
  random: () => number,
): DailyEntry | null {
  const order = ELIGIBLE.filter((question) => !used.has(question.id))
    .map((question) => ({ question, key: random() }))
    .sort((a, b) => a.key - b.key);
  for (const { question } of order) {
    const opened = buildPuzzle(
      question,
      samePromptPool(question, QUESTIONS),
      seededRandom(`${date}:${question.id}`),
    );
    if (opened) return { date, questionId: question.id, opened };
  }
  return null;
}
