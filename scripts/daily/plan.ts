/// <reference types="node" />
// Adds the next days of 今日の一問 to src/daily/schedule.json.
//   npx tsx scripts/daily/plan.ts [days=7]
// Each date picks a question with its own seeded random order, so a run
// gives the same result for the same schedule.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { QUESTIONS } from "../../src/data/questions";
import { isSpecialistCategory } from "../../src/data/specialistCategories";
import { buildPuzzle, samePromptPool } from "../../src/daily/puzzle";
import { seededRandom } from "../../src/daily/random";
import {
  addDays,
  DAILY_SCHEDULE,
  japanDate,
  type DailyEntry,
} from "../../src/daily/schedule";

const days = Number(process.argv[2] ?? 7);
const schedule: DailyEntry[] = [...DAILY_SCHEDULE];
const used = new Set(schedule.map((entry) => entry.questionId));
const today = japanDate(new Date());
const last = schedule.at(-1)?.date;
let date = last && last >= today ? addDays(last, 1) : today;

const eligible = QUESTIONS.filter(
  (question) =>
    question.language === "ja" &&
    question.length >= 4 &&
    question.length <= 6 &&
    !isSpecialistCategory(question.category),
);

for (let i = 0; i < days; i += 1, date = addDays(date, 1)) {
  const random = seededRandom(date);
  const order = eligible
    .filter((question) => !used.has(question.id))
    .map((question) => ({ question, key: random() }))
    .sort((a, b) => a.key - b.key);
  let added = false;
  for (const { question } of order) {
    const opened = buildPuzzle(
      question,
      samePromptPool(question, QUESTIONS),
      seededRandom(`${date}:${question.id}`),
    );
    if (!opened) continue;
    schedule.push({ date, questionId: question.id, opened });
    used.add(question.id);
    added = true;
    console.log(date, question.category, question.answers[0]?.display);
    break;
  }
  if (!added) throw new Error(`No puzzle found for ${date}`);
}

// Run from the repository root (npm run daily:plan).
const file = join(process.cwd(), "src/daily/schedule.json");
writeFileSync(
  file,
  `[\n${schedule.map((entry) => `  ${JSON.stringify(entry)}`).join(",\n")}\n]\n`,
);
