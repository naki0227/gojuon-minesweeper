import { describe, expect, it } from "vitest";

import { buildCustomQuestion } from "../src/custom/question";
import { adjacentMineCount, isMineCharacter } from "../src/game/engine";
import { safeHint } from "../src/game/hint";
import { guessSolo, hintSolo, startSolo } from "../src/game/solo";
import { PUZZLE_PACK } from "../src/puzzles/pack";
import { puzzleStars, startPuzzle } from "../src/puzzles/play";

const question = buildCustomQuestion({
  language: "ja",
  reading: "ねこ",
  display: "ねこ",
  hint: "どうぶつ",
})!;

describe("safe hint", () => {
  it("lights the closed safe cell with the most answer letters around it", () => {
    const char = safeHint(question, [])!;
    expect(isMineCharacter(question, char)).toBe(false);
    const best = Math.max(
      ...[
        "の",
        "ぬ",
        "に",
        "け",
        "く",
        "き",
        "そ",
        "す",
        "し",
        "せ",
        "て",
        "と",
      ]
        .filter((c) => !isMineCharacter(question, c))
        .map((c) => adjacentMineCount(question, c)),
    );
    expect(adjacentMineCount(question, char)).toBe(best);
    expect(safeHint(question, [char])).not.toBe(char);
    expect(safeHint(question, [], [char])).not.toBe(char);
  });

  it("adds hints to a solo game only while it is on", () => {
    let play = hintSolo(startSolo(question));
    expect(play.hints).toHaveLength(1);
    play = hintSolo(play);
    expect(play.hints).toHaveLength(2);
    expect(new Set(play.hints).size).toBe(2);
    const solved = guessSolo(play, "ねこ");
    expect(hintSolo(solved)).toBe(solved);
  });

  it("gives at most one star to a 詰め五十音 solved with a hint", () => {
    const entry = PUZZLE_PACK[0]!;
    const word = startPuzzle(entry).question.answers[0]!.value;
    const clean = guessSolo(startPuzzle(entry), word);
    expect(puzzleStars(clean, entry.par)).toBe(3);
    const hinted = guessSolo(hintSolo(startPuzzle(entry)), word);
    expect(puzzleStars(hinted, entry.par)).toBe(1);
  });
});
