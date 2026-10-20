import { describe, expect, it } from "vitest";

import {
  CATEGORY_GROUPS,
  findSelectedGroup,
  groupCategoriesIn,
} from "../src/data/categoryGroups";
import { LEGACY_CATEGORIES } from "../src/data/legacyCategories";
import {
  countQuestions,
  getCategories,
  matchesLength,
} from "../src/data/questions";

describe("category groups", () => {
  it("puts every category in exactly one group", () => {
    for (const category of getCategories("any")) {
      const owners = CATEGORY_GROUPS.filter((group) =>
        group.categories.includes(category),
      );
      expect(
        owners.map((group) => group.id),
        category,
      ).toHaveLength(1);
    }
  });

  it("recognises a group from its selected categories", () => {
    const available = getCategories("ja");
    const geography = CATEGORY_GROUPS.find(
      (group) => group.id === "geography",
    )!;
    const selected = groupCategoriesIn(geography, available);

    expect(findSelectedGroup(selected, available)?.id).toBe("geography");
    expect(findSelectedGroup(selected.slice(0, 1), available)).toBeNull();
    expect(findSelectedGroup([], available)).toBeNull();
  });
});

describe("split categories", () => {
  it("still finds questions for old category names", () => {
    const current = getCategories("ja");
    for (const [old, successors] of Object.entries(LEGACY_CATEGORIES)) {
      expect(current, old).not.toContain(old);
      for (const category of successors) expect(current).toContain(category);
      const filters = { language: "ja", length: "any" } as const;
      expect(countQuestions({ ...filters, categories: [old] }), old).toBe(
        countQuestions({ ...filters, categories: successors }),
      );
    }
  });
});

describe("length ranges", () => {
  it("matches exact lengths, ranges and open-ended ranges", () => {
    expect(matchesLength(3, "any")).toBe(true);
    expect(matchesLength(3, 3)).toBe(true);
    expect(matchesLength(4, 3)).toBe(false);
    expect(matchesLength(4, { min: 2, max: 4 })).toBe(true);
    expect(matchesLength(5, { min: 2, max: 4 })).toBe(false);
    expect(matchesLength(12, { min: 8, max: null })).toBe(true);
  });

  it("filters questions by a length range", () => {
    const short = countQuestions({
      language: "ja",
      categories: [],
      length: { min: 2, max: 4 },
    });
    const two = countQuestions({ language: "ja", categories: [], length: 2 });

    expect(short).toBeGreaterThan(two);
  });
});
