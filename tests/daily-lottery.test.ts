import { describe, expect, it } from "vitest";

import { normalizeValue } from "../src/game/normalize";
import {
  DAILY_SCHEDULE,
  GIFT_RULES_URL,
  dailyAnswer,
  dailyQuestion,
} from "../src/daily/schedule";
import {
  answerHash,
  lotterySection,
  puzzleJson,
  rulesList,
} from "../scripts/daily/lottery";
import { rulesPage } from "../scripts/daily/pages";

const entry = DAILY_SCHEDULE[0]!;

describe("puzzle.json for the プレゼント", () => {
  it("accepts the answer in hiragana or katakana, as hashes only", () => {
    const question = dailyQuestion(entry);
    const puzzle = JSON.parse(puzzleJson(entry)) as {
      date: string;
      language: string;
      answers: string[];
    };
    expect(puzzle.date).toBe(entry.date);
    expect(puzzle.language).toBe(question.language);
    const value = question.answers[0]!.value;
    const katakana = value.replace(/[ぁ-ゖ]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) + 0x60),
    );
    for (const typed of [value, katakana]) {
      const normalized = normalizeValue(typed, question.language);
      expect(puzzle.answers).toContain(answerHash(entry.date, normalized));
    }
    expect(puzzleJson(entry)).not.toContain(dailyAnswer(entry));
    expect(puzzleJson(entry)).not.toContain(value);
  });

  it("hashes with the date, so one day's hash fails on another", () => {
    expect(answerHash("2026-10-15", "あ")).not.toBe(
      answerHash("2026-10-16", "あ"),
    );
    expect(answerHash("2026-10-15", "あ")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("the プレゼント box", () => {
  const endpoint = "https://example.supabase.co/functions/v1/daily-lottery";

  it("takes answers on today's page only", () => {
    const today = lotterySection(entry, true, endpoint);
    expect(today).toContain('id="gift-send"');
    expect(today).toContain(endpoint);
    const past = lotterySection(entry, false, endpoint);
    expect(past).not.toContain('id="gift-send"');
    expect(past).toContain('id="gift" hidden');
  });

  it("never puts the answer on the page", () => {
    expect(lotterySection(entry, true, endpoint)).not.toContain(
      dailyAnswer(entry),
    );
  });
});

describe("the プレゼント rules page", () => {
  it("has the rules the app links to, and says Apple is not a sponsor", () => {
    const page = rulesPage();
    expect(page).toContain(rulesList());
    expect(page).toContain("Appleが提供・協賛するものではありません");
    expect(page).toContain("購入は必要ありません");
    expect(GIFT_RULES_URL).toBe("https://minesweeper.enludus.com/daily/rules/");
  });
});
