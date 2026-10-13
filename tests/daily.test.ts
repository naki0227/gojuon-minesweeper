import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../src/data/questions";
import {
  buildPuzzle,
  consistentCandidates,
  DEFAULT_PUZZLE_OPTIONS,
  samePromptPool,
} from "../src/daily/puzzle";
import { seededRandom } from "../src/daily/random";
import {
  addDays,
  DAILY_SCHEDULE,
  dailyPostTexts,
  dailyQuestion,
  japanDate,
  shortDate,
} from "../src/daily/schedule";
import { isMineCharacter } from "../src/game/engine";

describe("daily schedule", () => {
  it("has one puzzle per day, in order, never repeating a question", () => {
    const ids = new Set<string>();
    DAILY_SCHEDULE.forEach((entry, i) => {
      if (i > 0) {
        expect(entry.date).toBe(addDays(DAILY_SCHEDULE[i - 1]!.date, 1));
      }
      expect(ids.has(entry.questionId)).toBe(false);
      ids.add(entry.questionId);
    });
  });

  // Guards against question bank edits that would change a posted puzzle.
  it("keeps every puzzle fair: narrowed down, answer not given away", () => {
    for (const entry of DAILY_SCHEDULE) {
      const question = dailyQuestion(entry);
      const pool = samePromptPool(question, QUESTIONS);
      const candidates = consistentCandidates(question, pool, entry.opened);
      expect(candidates.map((c) => c.id)).toContain(question.id);
      expect(candidates.length).toBeLessThanOrEqual(
        DEFAULT_PUZZLE_OPTIONS.maxCandidates,
      );
      const shownLetters = entry.opened.filter((char) =>
        isMineCharacter(question, char),
      );
      expect(shownLetters.length).toBeLessThan(question.length / 2);
    }
  });

  it("never puts the answer in the post texts", () => {
    for (const entry of DAILY_SCHEDULE) {
      const { post, reply } = dailyPostTexts(entry);
      const answer = dailyQuestion(entry).answers[0]!.display;
      expect(post).not.toContain(answer);
      expect(reply).not.toContain(answer);
    }
  });
});

describe("daily helpers", () => {
  it("uses the Japan date", () => {
    expect(japanDate(new Date("2026-10-13T14:59:00Z"))).toBe("2026-10-13");
    expect(japanDate(new Date("2026-10-13T15:00:00Z"))).toBe("2026-10-14");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(shortDate("2026-01-05")).toBe("1/5");
  });

  it("builds the same puzzle from the same seed", () => {
    const question = dailyQuestion(DAILY_SCHEDULE[0]!);
    const pool = samePromptPool(question, QUESTIONS);
    const a = buildPuzzle(question, pool, seededRandom("x"));
    const b = buildPuzzle(question, pool, seededRandom("x"));
    expect(a).toEqual(b);
  });
});
