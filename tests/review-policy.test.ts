import { describe, expect, it } from "vitest";

import {
  afterWin,
  ASK_AGAIN_AFTER_MS,
  INITIAL_REVIEW_STATE,
  parseReviewState,
  WINS_BEFORE_ASKING,
} from "../src/review/reviewPolicy";

describe("review prompt policy", () => {
  it("asks on the third win, then waits", () => {
    let state = INITIAL_REVIEW_STATE;
    const asked: boolean[] = [];
    for (let i = 0; i < WINS_BEFORE_ASKING + 3; i += 1) {
      const result = afterWin(state, 1000);
      asked.push(result.ask);
      state = result.state;
    }
    expect(asked).toEqual([false, false, true, false, false, false]);
  });

  it("asks again only after the waiting period", () => {
    const state = { wins: 5, askedAt: 0 };
    expect(afterWin(state, ASK_AGAIN_AFTER_MS - 1).ask).toBe(false);
    expect(afterWin(state, ASK_AGAIN_AFTER_MS).ask).toBe(true);
  });

  it("reads broken storage as a fresh start", () => {
    expect(parseReviewState(null)).toEqual(INITIAL_REVIEW_STATE);
    expect(parseReviewState("{oops")).toEqual(INITIAL_REVIEW_STATE);
    expect(parseReviewState('{"wins":2,"askedAt":5}')).toEqual({
      wins: 2,
      askedAt: 5,
    });
  });
});
