import { describe, expect, it } from "vitest";

import { QUESTIONS, primaryAnswer } from "../src/data/questions";
import type { Question } from "../src/data/types";
import { isMineCharacter } from "../src/game/engine";
import { getBoardOrder } from "../src/game/board";
import { cleanLine } from "../scripts/live/host";
import { applyComment, displayName, newRound } from "../scripts/live/round";
import {
  addComment,
  GIVE_UP_DELAY,
  NEXT_DELAY,
  newSession,
  tick,
  topScores,
} from "../scripts/live/session";

const question = QUESTIONS.find(
  (item) => item.language === "ja" && primaryAnswer(item).value.length === 4,
)!;
const answer = primaryAnswer(question);
const safe = getBoardOrder("ja").find(
  (char) => !isMineCharacter(question, char),
)!;
const mine = [...answer.value].find((char) =>
  getBoardOrder("ja").includes(char),
)!;
const pick = (_excludeId?: string): Question => question;

describe("live rounds", () => {
  it("opens a cell for a one-kana comment, katakana too", () => {
    const { round, event } = applyComment(newRound(question), "a", safe);
    expect(event.kind).toBe("open");
    expect(round.opened).toContain(safe);
    const katakana = String.fromCodePoint(mine.codePointAt(0)! + 0x60);
    const second = applyComment(round, "b", katakana);
    expect(second.event).toMatchObject({ kind: "open", mine: true });
  });

  it("ignores chat that is neither a cell nor a guess", () => {
    const round = newRound(question);
    expect(applyComment(round, "a", "こんばんは！！").event.kind).toBe("none");
    expect(applyComment(round, "a", "lol").event.kind).toBe("none");
  });

  it("takes the answer with or without 答え：, and only once", () => {
    const round = newRound(question);
    expect(applyComment(round, "a", "答え：あああああ").event.kind).toBe(
      "wrong",
    );
    const plain = applyComment(round, "a", answer.display);
    expect(plain.event).toMatchObject({ kind: "solved", points: 10 });
    expect(applyComment(round, "a", `答え:${answer.display}`).event.kind).toBe(
      "solved",
    );
    expect(applyComment(plain.round, "b", answer.display).event.kind).toBe(
      "none",
    );
  });

  it("cuts long names", () => {
    expect(displayName("  ")).toBe("名無し");
    expect(displayName("あ".repeat(20))).toBe(`${"あ".repeat(12)}…`);
  });
});

describe("live session", () => {
  it("scores the solver and moves to the next puzzle", () => {
    const start = newSession(pick);
    const { session } = addComment(start, "たろう", answer.display, 1000);
    expect(topScores(session)).toEqual([{ name: "たろう", points: 10 }]);
    expect(tick(session, 1000 + NEXT_DELAY - 1, pick).roundNo).toBe(1);
    const next = tick(session, 1000 + NEXT_DELAY, pick);
    expect(next.roundNo).toBe(2);
    expect(next.round.opened).toEqual([]);
  });

  it("gives the answer when the board is open and nobody got it", () => {
    let session = newSession(pick);
    for (const char of getBoardOrder("ja")) {
      if (!isMineCharacter(question, char)) {
        session = addComment(session, "a", char, 0).session;
      }
    }
    expect(session.doneAt).toBe(0);
    session = tick(session, GIVE_UP_DELAY, pick);
    expect(session.log.at(-1)).toContain(answer.display);
    expect(session.nextAt).toBe(GIVE_UP_DELAY + NEXT_DELAY);
  });
});

describe("host lines", () => {
  it("keeps one short line without links", () => {
    expect(cleanLine("\n  正解！おめでとう\n2行目")).toBe("正解！おめでとう");
    expect(cleanLine("見てね https://example.com")).toBeNull();
    expect(Array.from(cleanLine("あ".repeat(80))!)).toHaveLength(51);
  });
});
