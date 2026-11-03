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

  it("replaces a planned day and adds the next one, with trivia", () => {
    const result = mergeIncoming(
      upcoming,
      [day("2026-11-06", a!, { trivia }), day("2026-11-07", "x")],
      options,
    );
    expect(result.upcoming.map((entry) => entry.questionId)).toEqual([b, a]);
    expect(result.upcoming[1]!.trivia).toBe(trivia);
    expect(result.log).toEqual([
      "2026-11-06: merged",
      "2026-11-07: skipped (unknown question)",
    ]);
  });

  it("never touches a day online, leaves a gap or reuses a question", () => {
    const result = mergeIncoming(
      upcoming,
      [
        day("2026-11-04", a!),
        day("2026-11-09", a!),
        day("2026-11-07", b!),
        day("2026-11-07", d!),
      ],
      options,
    );
    expect(result.upcoming).toEqual(upcoming);
    expect(result.log).toEqual([
      "2026-11-04: skipped (already online)",
      "2026-11-07: skipped (question already used)",
      "2026-11-07: skipped (question already used)",
      "2026-11-09: skipped (would leave a gap)",
    ]);
  });

  it("drops trivia of the wrong length but keeps the day", () => {
    const result = mergeIncoming(
      upcoming,
      [day("2026-11-07", a!, { trivia: "短い" })],
      options,
    );
    expect(result.upcoming.at(-1)).toEqual(day("2026-11-07", a!));
  });
});
