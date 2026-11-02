import type { Question } from "../data/types";
import { cellView } from "../daily/puzzle";
import { getBoardOrder } from "../game/board";

// 詰め五十音: from a board with some cells open, the fewest cells that are
// sure to narrow the words that fit down to one, however the cells turn
// out. Like a tsume-shogi problem, the answer is the best line against
// every possibility, not a lucky guess.

// Searching deeper than this is never needed for the puzzles we make and
// keeps the search quick.
export const MAX_DEPTH = 4;

export type Solver = {
  // Every word that fits the open cells.
  candidates: readonly Question[];
  closed: readonly string[];
  // What each candidate would show in each closed cell.
  views: ReadonlyMap<string, readonly string[]>;
};

export function createSolver(
  candidates: readonly Question[],
  opened: readonly string[],
): Solver {
  const language = candidates[0]?.language ?? "ja";
  const closed = getBoardOrder(language).filter((c) => !opened.includes(c));
  const views = new Map(
    closed.map((char) => [char, candidates.map((q) => cellView(q, char))]),
  );
  return { candidates, closed, views };
}

// Candidate indexes split by what `char` would show.
function split(solver: Solver, group: readonly number[], char: string) {
  const views = solver.views.get(char)!;
  const parts = new Map<string, number[]>();
  for (const index of group) {
    const view = views[index]!;
    const part = parts.get(view);
    if (part) part.push(index);
    else parts.set(view, [index]);
  }
  return [...parts.values()];
}

// The fewest cells to open that are sure to leave one word in `group`, or
// Infinity past `limit`.
function solveGroup(
  solver: Solver,
  group: readonly number[],
  used: ReadonlySet<string>,
  limit: number,
  memo: Map<string, number>,
): number {
  if (group.length <= 1) return 0;
  if (limit <= 0) return Infinity;
  const key = `${group.join(",")}|${limit}`;
  const known = memo.get(key);
  if (known !== undefined) return known;

  let best = Infinity;
  for (const char of solver.closed) {
    if (used.has(char)) continue;
    const parts = split(solver, group, char);
    // A cell that tells these words apart in no way is no use.
    if (parts.length === 1) continue;
    let worst = 0;
    const next = new Set(used).add(char);
    for (const part of parts) {
      worst = Math.max(
        worst,
        solveGroup(solver, part, next, Math.min(limit, best - 1) - 1, memo),
      );
      if (worst + 1 >= best) break;
    }
    best = Math.min(best, worst + 1);
    if (best === 1) break;
  }
  memo.set(key, best);
  return best;
}

export function allIndexes(solver: Solver): number[] {
  return solver.candidates.map((_, index) => index);
}

// The par of the puzzle: the fewest cells that settle the answer.
export function par(solver: Solver, limit = MAX_DEPTH): number {
  return solveGroup(solver, allIndexes(solver), new Set(), limit, new Map());
}

// The cells to open first that keep to par, with how they split the words.
export function bestFirstCells(
  solver: Solver,
  limit = MAX_DEPTH,
): { char: string; groups: number[] }[] {
  const target = par(solver, limit);
  if (!Number.isFinite(target) || target === 0) return [];
  const memo = new Map<string, number>();
  const result: { char: string; groups: number[] }[] = [];
  for (const char of solver.closed) {
    const parts = split(solver, allIndexes(solver), char);
    if (parts.length === 1) continue;
    const used = new Set([char]);
    const worst = Math.max(
      ...parts.map((part) => solveGroup(solver, part, used, target - 1, memo)),
    );
    if (worst + 1 === target) {
      result.push({ char, groups: parts.map((part) => part.length) });
    }
  }
  return result;
}
