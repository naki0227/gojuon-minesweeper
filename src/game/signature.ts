import { GOJUON_ORDER } from "./gojuon";
import { normalizeKana } from "./normalize";

const orderIndex = new Map(GOJUON_ORDER.map((char, index) => [char, index]));

export function createCountMap(value: string): Map<string, number> {
  const result = new Map<string, number>();

  for (const char of normalizeKana(value)) {
    result.set(char, (result.get(char) ?? 0) + 1);
  }

  return result;
}

export function createSignatureKey(value: string): string {
  return [...createCountMap(value).entries()]
    .sort(([left], [right]) => {
      return (orderIndex.get(left) ?? 999) - (orderIndex.get(right) ?? 999);
    })
    .map(([char, count]) => `${char}:${count}`)
    .join("|");
}

export function mineCharacters(value: string): Set<string> {
  return new Set(Array.from(normalizeKana(value)));
}
