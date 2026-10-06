import type { QuestionLanguage } from "../data/types";
import { getBoardOrder } from "./board";
import { normalizeValue } from "./normalize";

export function createCountMap(
  value: string,
  language: QuestionLanguage = "ja",
): Map<string, number> {
  const result = new Map<string, number>();

  for (const char of normalizeValue(value, language)) {
    result.set(char, (result.get(char) ?? 0) + 1);
  }

  return result;
}

export function createSignatureKey(
  value: string,
  language: QuestionLanguage = "ja",
): string {
  const orderIndex = new Map(
    getBoardOrder(language).map((char, index) => [char, index]),
  );

  return [...createCountMap(value, language).entries()]
    .sort(([left], [right]) => {
      return (orderIndex.get(left) ?? 999) - (orderIndex.get(right) ?? 999);
    })
    .map(([char, count]) => `${char}:${count}`)
    .join("|");
}

export function mineCharacters(
  value: string,
  language: QuestionLanguage = "ja",
): Set<string> {
  return new Set(Array.from(normalizeValue(value, language)));
}
