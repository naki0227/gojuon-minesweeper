import { addDays } from "./dates";

// Days in a row with the day's puzzle solved. Only solving counts; giving
// up or skipping a day starts over.
export type Streak = { lastSolved: string | null; count: number; best: number };

export const NO_STREAK: Streak = { lastSolved: null, count: 0, best: 0 };

export function recordSolve(streak: Streak, date: string): Streak {
  if (streak.lastSolved === date) return streak;
  const count = streak.lastSolved === addDays(date, -1) ? streak.count + 1 : 1;
  return { lastSolved: date, count, best: Math.max(streak.best, count) };
}

// The streak as of `today`: still alive until the end of the day after
// the last solve.
export function currentStreak(streak: Streak, today: string): number {
  if (!streak.lastSolved) return 0;
  return streak.lastSolved === today || streak.lastSolved === addDays(today, -1)
    ? streak.count
    : 0;
}
