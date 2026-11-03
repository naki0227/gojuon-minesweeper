/// <reference types="node" />
// Adds the next days of 今日の一問 to src/daily/schedule.upcoming.enc.
//   DAILY_SCHEDULE_KEY=... npx tsx scripts/daily/plan.ts [days=7]
// Each date picks a question in a random order seeded from the date and
// the key, so the same key gives the same result for the same schedule,
// and nobody without the key can rerun it to learn the coming answers.
import { seededRandom } from "../../src/daily/random";
import {
  addDays,
  japanDate,
  planSeed,
  requireFullSchedule,
  writeUpcoming,
  type DailyEntry,
} from "../../src/daily/schedule";
import { LEAKED, pickDay } from "./pick";

const days = Number(process.argv[2] ?? 7);
const schedule: DailyEntry[] = [...requireFullSchedule()];
const used = new Set([...schedule.map((entry) => entry.questionId), ...LEAKED]);
const today = japanDate(new Date());
const last = schedule.at(-1)?.date;
let date = last && last >= today ? addDays(last, 1) : today;

for (let i = 0; i < days; i += 1, date = addDays(date, 1)) {
  const entry = pickDay(date, used, seededRandom(planSeed(date)));
  if (!entry) throw new Error(`No puzzle found for ${date}`);
  schedule.push(entry);
  used.add(entry.questionId);
  // Only the date: Actions logs of the public repository are public too.
  console.log(date);
}

writeUpcoming(schedule);
