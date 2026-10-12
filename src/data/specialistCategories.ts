// Advanced computing topics should only appear when explicitly selected.
// Empty category filters represent the broadly accessible random pool.
export const SPECIALIST_IT_CATEGORIES: ReadonlySet<string> = new Set([
  "IT用語",
  "Programming",
  "Coding",
  "Algorithms",
  "Data Structures",
  "Machine Learning",
  "Technology",
]);

export function isSpecialistItCategory(category: string): boolean {
  return SPECIALIST_IT_CATEGORIES.has(category);
}
