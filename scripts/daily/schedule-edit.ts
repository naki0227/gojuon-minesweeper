/// <reference types="node" />
// Edits the coming days of 今日の一問 (for example to add trivia) by hand.
//   DAILY_SCHEDULE_KEY=... npx tsx scripts/daily/schedule-edit.ts open
//     writes src/daily/schedule.upcoming.json (git-ignored) to edit
//   DAILY_SCHEDULE_KEY=... npx tsx scripts/daily/schedule-edit.ts close
//     encrypts it back into schedule.upcoming.enc and deletes it
//   npx tsx scripts/daily/schedule-edit.ts last
//     prints the last planned date (needs the key when days are encrypted)
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import releasedSchedule from "../../src/daily/schedule.json";
import {
  requireFullSchedule,
  writeUpcoming,
  type DailyEntry,
} from "../../src/daily/schedule";

const PLAIN_FILE = join(process.cwd(), "src/daily/schedule.upcoming.json");
const releasedLast = (releasedSchedule as DailyEntry[]).at(-1)?.date ?? "";

const command = process.argv[2];
if (command === "open") {
  const upcoming = requireFullSchedule().filter(
    (entry) => entry.date > releasedLast,
  );
  writeFileSync(PLAIN_FILE, `${JSON.stringify(upcoming, null, 2)}\n`);
  console.log(`Wrote ${PLAIN_FILE}; run "close" when done.`);
} else if (command === "close") {
  if (!existsSync(PLAIN_FILE)) throw new Error(`${PLAIN_FILE} not found`);
  const upcoming = JSON.parse(readFileSync(PLAIN_FILE, "utf8")) as DailyEntry[];
  writeUpcoming(upcoming);
  rmSync(PLAIN_FILE);
  console.log("Encrypted into src/daily/schedule.upcoming.enc.");
} else if (command === "last") {
  console.log(requireFullSchedule().at(-1)?.date ?? "");
} else {
  console.error("usage: schedule-edit.ts open | close | last");
  process.exit(2);
}
