// Categories that only appear when explicitly selected: advanced IT
// topics, and niche ones (players' names, trending words) that would feel
// unfair in a random pick. Empty category filters represent the broadly
// accessible random pool.
export const SPECIALIST_CATEGORIES: ReadonlySet<string> = new Set([
  "IT用語",
  "Programming",
  "Coding",
  "Algorithms",
  "Data Structures",
  "Machine Learning",
  "Technology",
  "野球選手",
  "サッカー選手",
  "流行語",
]);

export function isSpecialistCategory(category: string): boolean {
  return SPECIALIST_CATEGORIES.has(category);
}
