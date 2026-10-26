// The day's puzzle for the app, read from the site so new days need no
// app update. publish.ts writes /daily/<date>/app.json each morning.
import { QUESTIONS } from "../data/questions";
import type { Question } from "../data/types";
import { SITE_URL } from "../links/site";
import { addDays, currentPuzzleDate } from "./schedule";

export type RemoteDaily = {
  date: string;
  question: Question;
  opened: string[];
  trivia?: string;
  // False for yesterday's puzzle, shown while today's is not online yet.
  isToday: boolean;
};

export type DailyLoad =
  | { status: "ok"; daily: RemoteDaily }
  | { status: "missing" } // nothing online, or the app is too old for it
  | { status: "offline" };

type AppJson = {
  date: string;
  questionId: string;
  opened: string[];
  trivia?: string;
};

async function fetchDay(date: string): Promise<AppJson | null> {
  const response = await fetch(`${SITE_URL}/daily/${date}/app.json`);
  if (!response.ok) return null;
  // A day that is not online yet is not a 404: the site answers a missing
  // file with the app page (200 text/html), so only a JSON answer counts.
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("application/json")) return null;
  const json = (await response.json()) as AppJson;
  return json.date === date && Array.isArray(json.opened) ? json : null;
}

export async function loadDaily(now = new Date()): Promise<DailyLoad> {
  const today = currentPuzzleDate(now);
  try {
    for (const date of [today, addDays(today, -1)]) {
      const day = await fetchDay(date);
      if (!day) continue;
      const question = QUESTIONS.find((item) => item.id === day.questionId);
      if (!question) return { status: "missing" };
      return {
        status: "ok",
        daily: {
          date,
          question,
          opened: day.opened,
          trivia: day.trivia,
          isToday: date === today,
        },
      };
    }
    return { status: "missing" };
  } catch {
    return { status: "offline" };
  }
}
