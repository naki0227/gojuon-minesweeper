/// <reference types="node" />
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { QUESTIONS, primaryAnswer, questionPrompt } from "../data/questions";
import type { Question } from "../data/types";
import { dailyUrl, shortDate } from "./dates";
import releasedSchedule from "./schedule.json";

// The whole schedule names every coming day's answer, so only scripts and
// tests may import this file. The app reads each day from the site
// (remote.ts) and takes its date helpers from ./dates.
export {
  addDays,
  currentPuzzleDate,
  DAILY_RELEASE_HOUR,
  dailyUrl,
  GIFT_RULES_URL,
  japanDate,
  shortDate,
} from "./dates";

// One day of 今日の一問: the question and the cells shown open in the image.
// Written by scripts/daily/plan.ts; `trivia` is added by hand or by the
// weekly planning task before the day comes.
export type DailyEntry = {
  date: string; // YYYY-MM-DD, Japan time
  questionId: string;
  opened: string[];
  trivia?: string;
};

// The repository is public, so only days already online stay readable in
// schedule.json. Coming days live in schedule.upcoming.enc, encrypted with
// AES-256-GCM under DAILY_SCHEDULE_KEY (32 bytes, base64; an Actions secret).
// Without the key only the released days load, which is enough for tests;
// publishing and planning call requireFullSchedule() and stop instead.
// Scripts and tests run from the repository root (npm run ...).
const UPCOMING_FILE = join(process.cwd(), "src/daily/schedule.upcoming.enc");

function scheduleKey(): Buffer | undefined {
  const value = process.env.DAILY_SCHEDULE_KEY;
  if (!value) return undefined;
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("DAILY_SCHEDULE_KEY must be 32 bytes in base64");
  }
  return key;
}

// iv (12 bytes) + auth tag (16 bytes) + ciphertext, as base64.
export function encryptSchedule(entries: DailyEntry[], key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(entries), "utf8"),
    cipher.final(),
  ]);
  return `${Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64")}\n`;
}

export function decryptSchedule(text: string, key: Buffer): DailyEntry[] {
  const data = Buffer.from(text.trim(), "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  const body = Buffer.concat([
    decipher.update(data.subarray(28)),
    decipher.final(),
  ]);
  return JSON.parse(body.toString("utf8")) as DailyEntry[];
}

function loadUpcoming(): DailyEntry[] | undefined {
  if (!existsSync(UPCOMING_FILE)) return [];
  const key = scheduleKey();
  return key
    ? decryptSchedule(readFileSync(UPCOMING_FILE, "utf8"), key)
    : undefined;
}

const upcoming = loadUpcoming();

export const DAILY_SCHEDULE: DailyEntry[] = [
  ...(releasedSchedule as DailyEntry[]),
  ...(upcoming ?? []),
];

// For the publish and the planning, which must see every day.
export function requireFullSchedule(): DailyEntry[] {
  if (!upcoming) {
    throw new Error(
      "DAILY_SCHEDULE_KEY is not set, so the coming days of 今日の一問 cannot be read.",
    );
  }
  return DAILY_SCHEDULE;
}

// Writes the days after schedule.json (encrypted).
export function writeUpcoming(entries: DailyEntry[]): void {
  const key = scheduleKey();
  if (!key) throw new Error("DAILY_SCHEDULE_KEY is not set");
  const last = (releasedSchedule as DailyEntry[]).at(-1)?.date ?? "";
  writeFileSync(
    UPCOMING_FILE,
    encryptSchedule(
      entries.filter((entry) => entry.date > last),
      key,
    ),
  );
}

// Seeds the planning, so the public plan.ts cannot be rerun to learn which
// question a coming day gets.
export function planSeed(date: string): string {
  const key = scheduleKey();
  if (!key) throw new Error("DAILY_SCHEDULE_KEY is not set");
  return createHmac("sha256", key).update(date).digest("hex");
}

export function dailyEntry(date: string): DailyEntry | undefined {
  return DAILY_SCHEDULE.find((entry) => entry.date === date);
}

export function dailyQuestion(entry: DailyEntry): Question {
  const question = QUESTIONS.find((item) => item.id === entry.questionId);
  if (!question) throw new Error(`Unknown question ${entry.questionId}`);
  return question;
}

// What goes on X: the post (with the image) and the reply under it.
export function dailyPostTexts(entry: DailyEntry): {
  post: string;
  reply: string;
} {
  const prompt = questionPrompt(dailyQuestion(entry));
  return {
    post: [
      `【今日の一問 ${shortDate(entry.date)}】お題：${prompt}`,
      "開いたマスの数字（周りにある答えの文字の数）とオレンジの文字（答えに入っている文字）から、答えを推理してコメントしてね！",
      "#五十音マインスイーパー #今日の一問",
    ].join("\n"),
    reply: [
      "このページで答えると、ジェム10個のコードが当たるかも🎁",
      "答えは明日の朝7時に公開！",
      dailyUrl(entry.date),
    ].join("\n"),
  };
}

export function dailyAnswer(entry: DailyEntry): string {
  return primaryAnswer(dailyQuestion(entry)).display;
}
