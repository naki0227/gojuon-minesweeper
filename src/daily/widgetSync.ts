// The iPhone widgets play 今日の一問 too (targets/widget). The app and
// the widgets each keep the day's game and the streak, shared through the
// App Group; these merge the two copies so a game started in one goes on
// in the other and a solve in either counts for the streak.
import type { SavedPlay } from "./play";
import { addDays } from "./schedule";
import type { Streak } from "./streak";

export type WidgetShared = { play: SavedPlay | null; streak: Streak | null };

// The later day wins; on the same day a finished game, then the one with
// more moves.
export function mergePlay(
  a: SavedPlay | null,
  b: SavedPlay | null,
): SavedPlay | null {
  if (!a || !b) return a ?? b;
  if (a.date !== b.date) return a.date > b.date ? a : b;
  const aDone = a.phase !== "playing";
  const bDone = b.phase !== "playing";
  if (aDone !== bDone) return aDone ? a : b;
  return b.moves.length > a.moves.length ? b : a;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

// A streak covers the days from lastSolved - count + 1 to lastSolved. Two
// that overlap or meet are one run (the widget's first solve after days
// in the app continues the app's streak); otherwise the later one is the
// current streak.
export function mergeStreak(a: Streak, b: Streak): Streak {
  if (!a.lastSolved || !b.lastSolved) return a.lastSolved ? a : b;
  const [early, late] = a.lastSolved <= b.lastSolved ? [a, b] : [b, a];
  const earlyStart = addDays(early.lastSolved!, 1 - early.count);
  const lateStart = addDays(late.lastSolved!, 1 - late.count);
  const joined = lateStart <= addDays(early.lastSolved!, 1);
  const count = joined
    ? daysBetween(
        earlyStart < lateStart ? earlyStart : lateStart,
        late.lastSolved!,
      ) + 1
    : late.count;
  return {
    lastSolved: late.lastSolved,
    count,
    best: Math.max(a.best, b.best, count),
  };
}
