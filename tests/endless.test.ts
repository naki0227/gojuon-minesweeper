import { describe, expect, it } from "vitest";

import type { Question } from "../src/data/types";
import {
  BASE_QUESTION_SCORE,
  CHAIN_BONUS_PER_CELL,
  difficultyBonus,
  endEndless,
  MAX_DIFFICULTY_BONUS,
  FREE_REVIVE_LIMIT,
  grantHint,
  guessEndless,
  nextEndlessQuestion,
  openEndless,
  passEndless,
  questionScore,
  reviveEndless,
  startEndless,
} from "../src/endless/engine";

const question: Question = {
  id: "endless-test",
  language: "ja",
  category: "動物",
  length: 3,
  signature: "test",
  answers: [{ display: "ねこら", value: "ねこら", aliases: ["ねこら"] }],
};

describe("endless solo rules", () => {
  it("rewards solving immediately more than taking unnecessary turns", () => {
    const first = guessEndless(startEndless(question), "ねこら");
    const opened = openEndless(passEndless(startEndless(question)), "ね");
    const later = guessEndless(opened, "ねこら");
    expect(first.phase).toBe("cleared");
    expect(first.score).toBe(BASE_QUESTION_SCORE + difficultyBonus(question));
    expect(questionScore(opened)).toBeLessThan(first.score);
    expect(later.score).toBeLessThan(first.score);
  });

  it("counts a zero-cell cascade as one opening and awards chain points", () => {
    const after = openEndless(passEndless(startEndless(question)), "あ");
    expect(after.openedMoves).toBe(1);
    expect(after.lastChainBonus).toBe(
      (after.opened.length - 1) * CHAIN_BONUS_PER_CELL,
    );
    expect(after.lastChainBonus).toBeGreaterThan(0);
    expect(after.score).toBe(after.lastChainBonus);
  });

  it("loses three lives to three mines and only revives in revive state", () => {
    let state = startEndless(question);
    for (const mine of ["ね", "こ", "ら"]) {
      state = openEndless(passEndless(state), mine);
    }
    expect(state.lives).toBe(0);
    expect(state.phase).toBe("revive");
    expect(state.totalMineHits).toBe(3);
    const revived = reviveEndless(state);
    expect(revived.lives).toBe(2);
    expect(revived.revives).toBe(1);
    expect(revived.phase).toBe("answer");
    expect(revived.hints).toHaveLength(1);
    expect(revived.opened).not.toContain(revived.hints[0]);
    expect(endEndless(state).phase).toBe("finished");
    expect(FREE_REVIVE_LIMIT).toBe(3);
  });

  it("reveals a safe cell without automatically opening it", () => {
    const initial = startEndless(question);
    const hinted = grantHint(initial);
    expect(hinted.hints).toHaveLength(1);
    expect(hinted.opened).toHaveLength(0);
    expect(hinted.hintUses).toBe(1);
  });

  it("carries score and survival progress across questions", () => {
    const solved = guessEndless(startEndless(question), "ねこら");
    const next = nextEndlessQuestion(solved, { ...question, id: "next" });
    expect(next.score).toBe(solved.score);
    expect(next.solved).toBe(1);
    expect(next.lives).toBe(3);
    expect(next.question.id).toBe("next");
    expect(next.openedMoves).toBe(0);
  });

  it("scales the base score by answer length and distinct mine letters", () => {
    const shaped = (value: string): Question => ({
      ...question,
      id: value,
      length: Array.from(value).length,
      answers: [{ display: value, value, aliases: [value] }],
    });
    const anchor = shaped("さくらん");
    expect(difficultyBonus(anchor)).toBe(0);
    expect(difficultyBonus(shaped("ねこ"))).toBeLessThan(0);
    const long = shaped("ちょこれーとけーき");
    expect(difficultyBonus(long)).toBeGreaterThan(0);
    // Repeated letters mean fewer distinct mines than characters.
    expect(difficultyBonus(shaped("ちょうちょう"))).toBeLessThan(
      difficultyBonus(shaped("かぶとむしだ")),
    );
    const solved = guessEndless(
      startEndless(long),
      Array.from("ちょこれーとけーき").join(""),
    );
    expect(solved.score).toBe(BASE_QUESTION_SCORE + difficultyBonus(long));
    expect(solved.message).toContain("難易度ボーナス");
  });

  it("keeps the difficulty bonus within bounds and the score floor at 10", () => {
    const value = "abcdefghijklmnopqrstuvwxyz";
    const huge: Question = {
      ...question,
      language: "en",
      length: value.length,
      answers: [{ display: value, value, aliases: [value] }],
    };
    expect(difficultyBonus(huge)).toBe(MAX_DIFFICULTY_BONUS);
    const battered = {
      ...startEndless(question),
      openedMoves: 30,
      mineHits: 3,
    };
    expect(questionScore(battered)).toBe(10);
  });
});
