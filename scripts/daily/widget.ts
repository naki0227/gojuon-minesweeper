// widget.json: the day's puzzle for the iPhone widgets
// (targets/widget), which can't run the game's TypeScript. Every open
// cell's view is worked out here, so the widget only looks cells up; the
// answer is one of four words, kept as a hash like the プレゼント's.
import { getBoardGrid } from "../../src/game/board";
import {
  primaryAnswer,
  QUESTIONS,
  questionPrompt,
} from "../../src/data/questions";
import type { Question } from "../../src/data/types";
import {
  cellView,
  consistentCandidates,
  samePromptPool,
  shuffled,
} from "../../src/daily/puzzle";
import { seededRandom } from "../../src/daily/random";
import { dailyQuestion, type DailyEntry } from "../../src/daily/schedule";
import { seasonOf } from "../../src/theme/season";
import { answerHash } from "./lottery";

export type WidgetDay = {
  version: 1;
  date: string;
  prompt: string;
  rows: (string | null)[][];
  // "s2": a safe cell next to two answer letters; "m1": a letter found
  // once in the answer.
  cells: Record<string, string>;
  opened: string[];
  choices: string[];
  answer: string;
  season: string | null;
};

function cellViews(question: Question): Record<string, string> {
  const views: Record<string, string> = {};
  for (const char of getBoardGrid(question.language).flat()) {
    if (char) views[char] = cellView(question, char);
  }
  return views;
}

// The answer and three words with the same prompt, preferring words the
// starting board can't yet tell apart from it, so opening cells helps.
export function widgetChoices(
  entry: DailyEntry,
  questions: readonly Question[] = QUESTIONS,
): string[] {
  const target = dailyQuestion(entry);
  const answer = primaryAnswer(target).display;
  const random = seededRandom(`${entry.date}:widget`);
  const pool = samePromptPool(target, questions);
  const close = consistentCandidates(target, pool, entry.opened);
  const words = [...shuffled(close, random), ...shuffled(pool, random)].map(
    (question) => primaryAnswer(question).display,
  );
  const others = [...new Set(words)].filter((word) => word !== answer);
  return shuffled([answer, ...others.slice(0, 3)], random);
}

export function widgetJson(entry: DailyEntry): string {
  const question = dailyQuestion(entry);
  const day: WidgetDay = {
    version: 1,
    date: entry.date,
    prompt: questionPrompt(question),
    rows: getBoardGrid(question.language).map((row) => [...row]),
    cells: cellViews(question),
    opened: entry.opened,
    choices: widgetChoices(entry),
    answer: answerHash(entry.date, primaryAnswer(question).display),
    season: seasonOf(entry.date),
  };
  return JSON.stringify(day);
}
