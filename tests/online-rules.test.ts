import { describe, expect, it } from "vitest";

import type { Question } from "../src/data/types";
import { createInitialState } from "../src/game/engine";
import { normalizeRoomCode, seatOf } from "../src/online/protocol";
import {
  applyMove,
  concedeGame,
  restoreGame,
  sanitizeFilters,
  startOnlineGame,
  storeGame,
  toPublicState,
} from "../src/online/rules";

const question: Question = {
  id: "test-cat",
  language: "en",
  category: "Animals",
  length: 3,
  signature: "ACT",
  answers: [{ display: "cat", value: "cat", aliases: ["cat"] }],
};

describe("online public state", () => {
  it("never contains the answer while the game is running", () => {
    let state = createInitialState(question);
    const moved = applyMove(state, 0, { type: "pass" });
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    state = moved.state;

    const opened = applyMove(state, 0, { type: "open", char: "Z" });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const json = JSON.stringify(toPublicState(opened.state));
    expect(json).not.toMatch(/cat/i);
    expect(toPublicState(opened.state).answers).toBeNull();
  });

  it("reports counts only for opened safe cells and mines only once hit", () => {
    const state = {
      ...createInitialState(question),
      openedChars: ["B", "C"],
    };
    const view = toPublicState(state);
    expect(view.mineChars).toEqual(["C"]);
    expect(Object.keys(view.mineCounts)).toEqual(["B"]);
    expect(view.mineCounts.B).toBe(2);
  });

  it("reveals the answers when finished", () => {
    const moved = applyMove(createInitialState(question), 0, {
      type: "answer",
      text: "cat",
    });
    expect(moved.ok && toPublicState(moved.state).answers).toEqual(["cat"]);
  });
});

describe("online moves", () => {
  it("rejects moves from the player who is not on turn", () => {
    const result = applyMove(createInitialState(question), 1, {
      type: "pass",
    });
    expect(result).toEqual({ ok: false, error: "相手の手番です。" });
  });

  it("rejects opening before answering and unknown characters", () => {
    const state = createInitialState(question);
    expect(applyMove(state, 0, { type: "open", char: "A" }).ok).toBe(false);
    const passed = applyMove(state, 0, { type: "pass" });
    if (!passed.ok) throw new Error("pass failed");
    expect(applyMove(passed.state, 0, { type: "open", char: "あ" }).ok).toBe(
      false,
    );
  });

  it("concedes to the other player", () => {
    const state = concedeGame(createInitialState(question), 0, "timeout");
    expect(state.phase).toBe("finished");
    expect(state.winner).toBe(1);
  });
});

describe("stored games", () => {
  it("round-trips through storage by question id", () => {
    const state = startOnlineGame({
      language: "ja",
      categories: [],
      length: "any",
    });
    const stored = JSON.parse(JSON.stringify(storeGame(state)));
    expect(stored.question).toBeUndefined();
    expect(restoreGame(stored)).toEqual(state);
  });
});

describe("input sanitising", () => {
  it("falls back to safe filters", () => {
    expect(
      sanitizeFilters({ language: "xx", categories: [1, "動物"] }),
    ).toEqual({ language: "ja", categories: ["動物"], length: "any" });
    expect(sanitizeFilters({ length: { min: 3, max: null } }).length).toEqual({
      min: 3,
      max: null,
    });
  });

  it("normalizes room codes", () => {
    expect(normalizeRoomCode(" サクラ 1２ ")).toBe("さくら12");
    expect(normalizeRoomCode("ABC")).toBe("abc");
    expect(normalizeRoomCode("あ")).toBeNull();
    expect(normalizeRoomCode("あ".repeat(17))).toBeNull();
  });

  it("finds seats", () => {
    expect(seatOf({ players: ["a", "b"] }, "b")).toBe(1);
    expect(seatOf({ players: ["a"] }, "c")).toBeNull();
  });
});
