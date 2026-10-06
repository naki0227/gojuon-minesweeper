import { afterEach, describe, expect, it, vi } from "vitest";

import {
  countQuestions,
  filterQuestions,
  getAvailableLengths,
  getCategories,
  pickRandomQuestion,
} from "../src/data/questions";

afterEach(() => vi.restoreAllMocks());

describe("question filters", () => {
  it("keeps language, category, and length filters consistent", () => {
    const category = getCategories("ja")[0];
    expect(category).toBeDefined();

    const lengths = getAvailableLengths({
      language: "ja",
      categories: [category!],
    });
    expect(lengths.length).toBeGreaterThan(0);

    const filters = {
      language: "ja" as const,
      categories: [category!],
      length: lengths[0]!,
    };
    const questions = filterQuestions(filters);

    expect(questions.length).toBeGreaterThan(0);
    expect(countQuestions(filters)).toBe(questions.length);
    expect(questions.every((question) => question.language === "ja")).toBe(
      true,
    );
    expect(questions.every((question) => question.category === category)).toBe(
      true,
    );
    expect(questions.every((question) => question.length === lengths[0])).toBe(
      true,
    );
  });
});

describe("curated category pool", () => {
  it("excludes Pokémon content and includes several everyday topics", () => {
    const categories = getCategories("ja");

    expect(categories.some((category) => /ポケモン/i.test(category))).toBe(
      false,
    );
    expect(
      getCategories("en").some((category) => /Pokémon/i.test(category)),
    ).toBe(false);
    expect(categories).toEqual(
      expect.arrayContaining(["文房具", "乗り物", "天気", "楽器"]),
    );
  });

  it("uses only selected categories and keeps length counts consistent", () => {
    const filters = {
      language: "ja" as const,
      categories: ["文房具", "楽器"],
      length: "any" as const,
    };
    const questions = filterQuestions(filters);

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((question) =>
        filters.categories.includes(question.category),
      ),
    ).toBe(true);
    expect(countQuestions(filters)).toBe(questions.length);
    expect(getAvailableLengths(filters).length).toBeGreaterThan(0);
  });

  it("treats an empty category selection as all categories", () => {
    const all = countQuestions({
      language: "ja",
      categories: [],
      length: "any",
    });
    const one = countQuestions({
      language: "ja",
      categories: ["文房具"],
      length: "any",
    });

    expect(all).toBeGreaterThan(one);
    expect(one).toBeGreaterThanOrEqual(15);
  });

  it("draws categories evenly before selecting a question", () => {
    const filters = {
      language: "ja" as const,
      categories: ["文房具", "都道府県"],
      length: "any" as const,
    };
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);
    const first = pickRandomQuestion(filters);
    vi.spyOn(Math, "random").mockReturnValueOnce(0.5).mockReturnValueOnce(0);
    const second = pickRandomQuestion(filters);

    expect(first?.category).toBe("都道府県");
    expect(second?.category).toBe("文房具");
  });

  it("returns no question for an unavailable length", () => {
    const filters = {
      language: "ja" as const,
      categories: ["文房具"],
      length: 100,
    };

    expect(countQuestions(filters)).toBe(0);
    expect(pickRandomQuestion(filters)).toBeNull();
  });
});
