/// <reference types="node" />
// The incoming days of 今日の一問 (see incoming.ts).
// Without the key (a Claude Code session):
//   npx tsx scripts/daily/incoming-cli.ts plan YYYY-MM-DD [days=7]
//     picks the days into src/daily/schedule.incoming.json (git-ignored),
//     where the 豆知識 are written by hand
//   npx tsx scripts/daily/incoming-cli.ts seal
//     seals that file into schedule.incoming.enc and deletes it
// With DAILY_SCHEDULE_KEY (Actions):
//   ... incoming-cli.ts merge    opens schedule.incoming.enc into the schedule
//   ... incoming-cli.ts pubkey   prints the public key for incoming.pub.pem
import { randomInt } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import releasedSchedule from "../../src/daily/schedule.json";
import {
  addDays,
  currentPuzzleDate,
  requireFullSchedule,
  scheduleKey,
  writeUpcoming,
  type DailyEntry,
} from "../../src/daily/schedule";
import {
  incomingPublicKeyPem,
  mergeIncoming,
  openIncoming,
  sealIncoming,
} from "./incoming";
import { LEAKED, pickDay } from "./pick";

const DIR = join(process.cwd(), "src/daily");
const PLAIN_FILE = join(DIR, "schedule.incoming.json");
const SEALED_FILE = join(DIR, "schedule.incoming.enc");
const PUBLIC_KEY_FILE = join(DIR, "incoming.pub.pem");
const released = releasedSchedule as DailyEntry[];

function requireKey(): Buffer {
  const key = scheduleKey();
  if (!key) throw new Error("DAILY_SCHEDULE_KEY is not set");
  return key;
}

const [command, ...args] = process.argv.slice(2);
if (command === "plan") {
  const start = args[0];
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    throw new Error("usage: plan YYYY-MM-DD [days]");
  }
  const days = Number(args[1] ?? 7);
  // Coming days are unknown here; the merge in Actions drops any repeat.
  const used = new Set([
    ...released.map((entry) => entry.questionId),
    ...LEAKED,
  ]);
  const random = () => randomInt(2 ** 32) / 2 ** 32;
  const planned: DailyEntry[] = [];
  for (let i = 0; i < days; i += 1) {
    const entry = pickDay(addDays(start, i), used, random);
    if (!entry) throw new Error(`No puzzle found for ${addDays(start, i)}`);
    planned.push({ ...entry, trivia: "" });
    used.add(entry.questionId);
  }
  writeFileSync(PLAIN_FILE, `${JSON.stringify(planned, null, 2)}\n`);
  console.log(`Wrote ${PLAIN_FILE}; add the trivia, then run "seal".`);
} else if (command === "seal") {
  const entries = JSON.parse(readFileSync(PLAIN_FILE, "utf8")) as DailyEntry[];
  writeFileSync(
    SEALED_FILE,
    sealIncoming(entries, readFileSync(PUBLIC_KEY_FILE, "utf8")),
  );
  rmSync(PLAIN_FILE);
  console.log(`Sealed ${entries.length} days into ${SEALED_FILE}.`);
} else if (command === "merge") {
  if (!existsSync(SEALED_FILE)) throw new Error(`${SEALED_FILE} not found`);
  const key = requireKey();
  const releasedLast = released.at(-1)?.date ?? "";
  const result = mergeIncoming(
    requireFullSchedule().filter((entry) => entry.date > releasedLast),
    openIncoming(readFileSync(SEALED_FILE, "utf8"), key),
    { released, today: currentPuzzleDate(new Date()), leaked: LEAKED },
  );
  writeUpcoming(result.upcoming);
  rmSync(SEALED_FILE);
  for (const line of result.log) console.log(line);
} else if (command === "pubkey") {
  process.stdout.write(incomingPublicKeyPem(requireKey()));
} else {
  console.error("usage: incoming-cli.ts plan | seal | merge | pubkey");
  process.exit(2);
}
