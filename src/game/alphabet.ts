export const ALPHABET_GRID: ReadonlyArray<ReadonlyArray<string | null>> = [
  ["A", "B", "C", "D", "E", "F"],
  ["G", "H", "I", "J", "K", "L"],
  ["M", "N", "O", "P", "Q", "R"],
  ["S", "T", "U", "V", "W", "X"],
  ["Y", "Z", null, null, null, null],
];

export const ALPHABET_ORDER = ALPHABET_GRID.flat().filter(
  (char): char is string => char !== null,
);

export const ALPHABET_SET = new Set(ALPHABET_ORDER);
