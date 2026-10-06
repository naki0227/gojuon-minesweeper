import { describe, expect, it } from "vitest";

import type { Question } from "../src/data/types";
import { getBoardOrder } from "../src/game/board";
import {
  answerHint,
  createInitialState,
  openCharacter,
  passAnswer,
  questionMineCharacters,
  submitAnswer,
} from "../src/game/engine";

const question: Question = {
  id: "test-cat",
  language: "en",
  category: "Animals",
  length: 3,
  signature: "ACT",
  answers: [{ display: "cat", value: "cat", aliases: ["cat"] }],
};

function almostCompleteBoard() {
  const mines = questionMineCharacters(question);
  return {
    ...createInitialState(question),
    phase: "open" as const,
    openedChars: getBoardOrder("en").filter(
      (char) => char !== "Z" && !mines.has(char),
    ),
  };
}

describe("exhausted board", () => {
  it("reveals one answer character after both players answer, then draws when all are shown", () => {
    const lastCell = openCharacter(almostCompleteBoard(), "Z");
    expect(lastCell.phase).toBe("answer");
    expect(lastCell.currentPlayer).toBe(1);
    expect(answerHint(lastCell)).toBe("C？？");
    expect(lastCell.openedChars).not.toContain("A");
    expect(lastCell.openedChars).toContain("C");
    expect(lastCell.openedChars).not.toContain("T");

    const secondTurn = passAnswer(lastCell);
    expect(secondTurn.phase).toBe("answer");
    expect(secondTurn.currentPlayer).toBe(0);
    expect(answerHint(secondTurn)).toBe("C？？");

    const nextHint = submitAnswer(secondTurn, "dog");
    expect(nextHint.phase).toBe("answer");
    expect(answerHint(nextHint)).toBe("CA？");
    expect(nextHint.openedChars).toContain("A");

    const nextTurn = passAnswer(nextHint);
    expect(answerHint(nextTurn)).toBe("CA？");
    const draw = passAnswer(nextTurn);
    expect(draw.phase).toBe("finished");
    expect(draw.winner).toBeNull();
    expect(answerHint(draw)).toBe("CAT");
    expect(draw.openedChars).toContain("T");
  });

  it("still awards a win for a correct final answer", () => {
    const lastCell = openCharacter(almostCompleteBoard(), "Z");
    const win = submitAnswer(lastCell, "cat");

    expect(win.phase).toBe("finished");
    expect(win.winner).toBe(1);
  });

  it("clears old mine penalties when the answer reveal begins", () => {
    const blocked = {
      ...almostCompleteBoard(),
      answerBlocked: [true, true] as const,
    };
    const firstHint = openCharacter(blocked, "Z");

    expect(firstHint.phase).toBe("answer");
    expect(firstHint.answerBlocked).toEqual([false, false]);
  });
});
