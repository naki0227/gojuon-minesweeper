/// <reference types="node" />
// Adds the next days of 今日の一問 to src/daily/schedule.upcoming.enc.
//   DAILY_SCHEDULE_KEY=... npx tsx scripts/daily/plan.ts [days=7]
// Each date picks a question in a random order seeded from the date and
// the key, so the same key gives the same result for the same schedule,
// and nobody without the key can rerun it to learn the coming answers.
import { QUESTIONS } from "../../src/data/questions";
import { isSpecialistCategory } from "../../src/data/specialistCategories";
import { buildPuzzle, samePromptPool } from "../../src/daily/puzzle";
import { seededRandom } from "../../src/daily/random";
import {
  addDays,
  japanDate,
  planSeed,
  requireFullSchedule,
  writeUpcoming,
  type DailyEntry,
} from "../../src/daily/schedule";

const days = Number(process.argv[2] ?? 7);
const schedule: DailyEntry[] = [...requireFullSchedule()];
// Planned for 2026-10-28 to 11-08 while the repository was private; the
// plan became readable when it went public, so these are never used.
const LEAKED = [
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
const used = new Set([...schedule.map((entry) => entry.questionId), ...LEAKED]);
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
  const random = seededRandom(planSeed(date));
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
    // Only the date: Actions logs of the public repository are public too.
    console.log(date);
    break;
  }
  if (!added) throw new Error(`No puzzle found for ${date}`);
}

writeUpcoming(schedule);
