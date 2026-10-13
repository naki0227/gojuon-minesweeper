import { QUESTIONS, primaryAnswer, questionPrompt } from "../data/questions";
import type { Question } from "../data/types";
import { SITE_URL } from "../links/site";
import rawSchedule from "./schedule.json";

// One day of 今日の一問: the question and the cells shown open in the image.
// Written by scripts/daily/plan.ts; `trivia` is added by hand or by the
// weekly planning task before the day comes.
export type DailyEntry = {
  date: string; // YYYY-MM-DD, Japan time
  questionId: string;
  opened: string[];
  trivia?: string;
};

export const DAILY_SCHEDULE = rawSchedule as DailyEntry[];

const JAPAN_OFFSET_MS = 9 * 60 * 60 * 1000;

// The calendar date in Japan (UTC+9, no daylight saving).
export function japanDate(now: Date): string {
  return new Date(now.getTime() + JAPAN_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(time).toISOString().slice(0, 10);
}

// "2026-10-14" -> "10/14"
export function shortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function dailyEntry(date: string): DailyEntry | undefined {
  return DAILY_SCHEDULE.find((entry) => entry.date === date);
}

export function dailyQuestion(entry: DailyEntry): Question {
  const question = QUESTIONS.find((item) => item.id === entry.questionId);
  if (!question) throw new Error(`Unknown question ${entry.questionId}`);
  return question;
}

export function dailyUrl(date: string): string {
  return `${SITE_URL}/daily/${date}/`;
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
    reply: `答えは明日このページで公開！\n${dailyUrl(entry.date)}`,
  };
}

export function dailyAnswer(entry: DailyEntry): string {
  return primaryAnswer(dailyQuestion(entry)).display;
}
