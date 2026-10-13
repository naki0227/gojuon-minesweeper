import { describe, expect, it } from "vitest";

import type { Question } from "../src/data/types";
import {
  guessEndless,
  openEndless,
  passEndless,
  startEndless,
} from "../src/endless/engine";
import { stingerFor } from "../src/endless/pauses";

const question: Question = {
  id: "stinger-test",
  language: "ja",
  category: "動物",
  length: 3,
  signature: "test",
  answers: [{ display: "ねこら", value: "ねこら", aliases: ["ねこら"] }],
};

describe("endless pauses", () => {
  it("pauses on a new question, a correct answer and the last life", () => {
    const start = startEndless(question);
    expect(stingerFor(start)?.kind).toBe("start");
    expect(stingerFor(passEndless(start))).toBeNull();
    expect(stingerFor(guessEndless(start, "ねこら"))?.kind).toBe("clear");

    let state = start;
    for (const mine of ["ね", "こ", "ら"]) {
      state = openEndless(passEndless(state), mine);
    }
    expect(state.phase).toBe("revive");
    expect(stingerFor(state)?.kind).toBe("over");
  });

  it("gives each pause its own key", () => {
    const start = stingerFor(startEndless(question));
    const clear = stingerFor(guessEndless(startEndless(question), "ねこら"));
    expect(start?.key).not.toBe(clear?.key);
  });
});
