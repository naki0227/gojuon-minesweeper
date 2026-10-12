import { describe, expect, it } from "vitest";

import type { Question } from "../src/data/types";
import {
  adjacentMineCount,
  createInitialState,
  openCharacter,
  questionMineMultiplicity,
} from "../src/game/engine";
import { toPublicState } from "../src/online/rules";

const butterfly: Question = {
  id: "test-butterfly",
  language: "ja",
  category: "動物",
  length: 6,
  signature: "",
  answers: [{ display: "ちょうちょう", value: "ちょうちょう", aliases: [] }],
};

describe("repeated answer letters", () => {
  it("counts every occurrence of an adjacent mine letter", () => {
    expect(questionMineMultiplicity(butterfly, "ち")).toBe(2);
    expect(questionMineMultiplicity(butterfly, "さ")).toBe(0);
    expect(adjacentMineCount(butterfly, "さ")).toBe(2);
  });

  it("reveals multiplicity only after the mine letter is opened online", () => {
    const hidden = toPublicState(createInitialState(butterfly));
    expect(hidden.mineMultiplicities).toEqual({});

    const revealed = toPublicState({
      ...createInitialState(butterfly),
      openedChars: ["ち", "さ"],
    });
    expect(revealed.mineChars).toEqual(["ち"]);
    expect(revealed.mineMultiplicities).toEqual({ ち: 2 });
    expect(revealed.mineCounts.さ).toBe(2);
  });

  it("mentions the multiplicity when a repeated mine letter is opened", () => {
    const opening = {
      ...createInitialState(butterfly),
      phase: "open" as const,
    };
    expect(openCharacter(opening, "ち").lastMessage).toContain("答えに2回");
    expect(openCharacter(opening, "さ").lastMessage).toContain(
      "周囲の答え文字は2個",
    );
  });

  it("does not mention multiplicity for safe letters", () => {
    const opening = {
      ...createInitialState(butterfly),
      phase: "open" as const,
    };
    expect(questionMineMultiplicity(butterfly, "ち")).toBe(2);
    expect(openCharacter(opening, "あ").lastMessage).not.toContain("答えに");
  });
});
