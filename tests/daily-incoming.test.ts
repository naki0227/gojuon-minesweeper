import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  incomingPublicKeyPem,
  mergeIncoming,
  openIncoming,
  sealIncoming,
} from "../scripts/daily/incoming";
import { ELIGIBLE } from "../scripts/daily/pick";
import type { DailyEntry } from "../src/daily/schedule";

const trivia =
  "ぶどう畑で、実ったぶどうを自分で摘み取って楽しむこと。秋が旬で、山梨県や長野県などが有名です。";
const [a, b, c, d] = ELIGIBLE.slice(0, 4).map((question) => question.id);
const day = (date: string, questionId: string, extra = {}): DailyEntry => ({
  date,
  questionId,
  opened: ["あ"],
  ...extra,
});

describe("sealed incoming days", () => {
  it("open only with the schedule key the public key came from", () => {
    const key = randomBytes(32);
    const entries = [day("2026-11-20", a!, { trivia })];
    const sealed = sealIncoming(entries, incomingPublicKeyPem(key));
    expect(sealed).not.toContain(a!);
    expect(openIncoming(sealed, key)).toEqual(entries);
    expect(() => openIncoming(sealed, randomBytes(32))).toThrow();
  });
});

describe("merging incoming days", () => {
  const released = [day("2026-11-01", d!)];
  const upcoming = [day("2026-11-05", b!), day("2026-11-06", c!)];
  const options = { released, today: "2026-11-04", leaked: [] };

  it("adds the days after the last planned one, never replacing any", () => {
    const result = mergeIncoming(
      upcoming,
      [day("2026-11-05", a!, { trivia }), day("2026-11-06", "x")],
      options,
    );
    expect(result.upcoming.slice(0, 2)).toEqual(upcoming);
    expect(result.upcoming[2]).toEqual(day("2026-11-07", a!, { trivia }));
    expect(result.log).toEqual([
      "2026-11-07: added with trivia",
      "incoming #2: skipped (unknown question)",
    ]);
  });

  it("starts from tomorrow when the schedule has run out", () => {
    const result = mergeIncoming([], [day("2026-11-01", a!)], options);
    expect(result.upcoming).toEqual([day("2026-11-05", a!)]);
  });

  it("never reuses a question and drops trivia of the wrong length", () => {
    const result = mergeIncoming(
      upcoming,
      [day("2026-11-07", b!), day("2026-11-08", a!, { trivia: "短い" })],
      options,
    );
    expect(result.upcoming.at(-1)).toEqual(day("2026-11-07", a!));
    expect(result.log[0]).toBe("incoming #1: skipped (question already used)");
  });
});
