import type { QuestionFilters } from "../data/types";

const DEFAULT_FILTERS: QuestionFilters = {
  language: "ja",
  categories: [],
  length: "any",
};

export function parseFilters(
  raw: string | string[] | undefined,
): QuestionFilters {
  if (typeof raw !== "string") return DEFAULT_FILTERS;
  try {
    const value = JSON.parse(raw) as QuestionFilters;
    if (!["ja", "en", "any"].includes(value.language)) return DEFAULT_FILTERS;
    if (!Array.isArray(value.categories)) return DEFAULT_FILTERS;
    if (!value.categories.every((item) => typeof item === "string"))
      return DEFAULT_FILTERS;
    const validLength =
      value.length === "any" ||
      (typeof value.length === "number" && Number.isInteger(value.length)) ||
      (typeof value.length === "object" &&
        value.length !== null &&
        typeof value.length.min === "number" &&
        (value.length.max === null || typeof value.length.max === "number"));
    return validLength ? value : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}
