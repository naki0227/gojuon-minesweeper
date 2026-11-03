import { describe, expect, it } from "vitest";

import { readTrivia } from "../scripts/daily/trivia";

describe("reading Claude's trivia reply", () => {
  const text =
    "ぶどう畑で、実ったぶどうを自分で摘み取って楽しむこと。秋が旬で、山梨県や長野県などが有名です。";

  it("takes a confident answer of the right length", () => {
    expect(readTrivia(JSON.stringify({ confident: true, trivia: text }))).toBe(
      text,
    );
    expect(
      readTrivia(
        `はい。\n${JSON.stringify({ confident: true, trivia: text })}`,
      ),
    ).toBe(text);
  });

  it("leaves the day empty when unsure, too short or not JSON", () => {
    expect(readTrivia(JSON.stringify({ confident: false, trivia: text }))).toBe(
      null,
    );
    expect(
      readTrivia(JSON.stringify({ confident: true, trivia: "短い" })),
    ).toBe(null);
    expect(readTrivia("わかりません")).toBe(null);
  });
});
