import { describe, expect, it } from "vitest";

import { primaryAnswer, QUESTIONS } from "../src/data/questions";
import { getBoardOrder } from "../src/game/board";
import { isMineCharacter } from "../src/game/engine";
import { fittingWords, PUZZLE_PACK, puzzleQuestion } from "../src/puzzles/pack";
import {
  giveUpPuzzle,
  guessPuzzle,
  openPuzzleCell,
  puzzleStars,
  startPuzzle,
} from "../src/puzzles/play";
import { bestFirstCells, createSolver, par } from "../src/puzzles/solver";

const entry = PUZZLE_PACK[0]!;

describe("詰め五十音 pack", () => {
  it("has 30 puzzles, getting harder, each on a known word", () => {
    expect(PUZZLE_PACK).toHaveLength(30);
    const pars = PUZZLE_PACK.map((p) => p.par);
    expect([...pars].sort()).toEqual(pars);
    for (const p of PUZZLE_PACK) {
      expect(QUESTIONS.some((q) => q.id === p.questionId)).toBe(true);
    }
  });

  it("states each puzzle's par, word count and first cells truly", () => {
    for (const p of PUZZLE_PACK) {
      const words = fittingWords(p);
      expect(words.length).toBe(p.words);
      expect(words.some((q) => q.id === p.questionId)).toBe(true);
      const solver = createSolver(words, p.opened);
      expect(par(solver)).toBe(p.par);
      expect(bestFirstCells(solver).map((c) => c.char)).toEqual(p.firstCells);
    }
  });
});

describe("solver", () => {
  it("needs no move when one word fits, and finds a one-cell split", () => {
    const question = QUESTIONS.find((q) => q.language === "ja")!;
    expect(par(createSolver([question], []))).toBe(0);
    // Two words that differ at some cell are told apart in one move.
    const other = QUESTIONS.find(
      (q) =>
        q.language === "ja" &&
        q.length === question.length &&
        q.signature !== question.signature,
    )!;
    expect(par(createSolver([question, other], []))).toBe(1);
  });

  it("keeps to par by following its first cells", () => {
    const p = PUZZLE_PACK.find((x) => x.par === 3)!;
    const words = fittingWords(p);
    const first = p.firstCells[0]!;
    const target = puzzleQuestion(p);
    const after = fittingWords(p, [...p.opened, first]);
    expect(after.some((q) => q.id === target.id)).toBe(true);
    expect(par(createSolver(after, [...p.opened, first]))).toBeLessThan(p.par);
    expect(after.length).toBeLessThan(words.length);
  });
});

describe("playing a puzzle", () => {
  const question = puzzleQuestion(entry);

  it("counts taps and wrong answers, not the cells a zero opens", () => {
    let play = startPuzzle(entry);
    const safe = getBoardOrder("ja").find(
      (c) => !play.opened.includes(c) && !isMineCharacter(question, c),
    )!;
    play = openPuzzleCell(play, safe);
    expect(play.moves).toBe(1);
    expect(play.opened.length).toBeGreaterThan(entry.opened.length);
    expect(openPuzzleCell(play, safe).moves).toBe(1);
    play = guessPuzzle(play, "まちがい");
    expect(play.moves).toBe(2);
    expect(play.wrong).toEqual(["まちがい"]);
  });

  it("gives stars against par when solved", () => {
    const answer = primaryAnswer(question).display;
    const solved = guessPuzzle(startPuzzle(entry), answer);
    expect(solved.status).toBe("solved");
    expect(puzzleStars(solved)).toBe(3);
    expect(puzzleStars({ ...solved, moves: entry.par + 1 })).toBe(2);
    expect(puzzleStars({ ...solved, moves: entry.par + 5 })).toBe(1);
    expect(puzzleStars(giveUpPuzzle(startPuzzle(entry)))).toBe(0);
  });
});
