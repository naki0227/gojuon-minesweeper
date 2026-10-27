import { QUESTIONS, primaryAnswer, questionPrompt } from "../data/questions";
import type { Question } from "../data/types";
import { dailyUrl, shortDate } from "./dates";
import rawSchedule from "./schedule.json";

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

export const DAILY_SCHEDULE = rawSchedule as DailyEntry[];

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
