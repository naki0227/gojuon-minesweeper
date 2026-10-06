export const GOJUON_GRID: ReadonlyArray<ReadonlyArray<string | null>> = [
  ["わ", "ら", "や", "ま", "は", "な", "た", "さ", "か", "あ"],
  ["を", "り", null, "み", "ひ", "に", "ち", "し", "き", "い"],
  ["ん", "る", "ゆ", "む", "ふ", "ぬ", "つ", "す", "く", "う"],
  ["ー", "れ", null, "め", "へ", "ね", "て", "せ", "け", "え"],
  [null, "ろ", "よ", "も", "ほ", "の", "と", "そ", "こ", "お"],
];

export const GOJUON_ORDER = GOJUON_GRID.flat().filter(
  (char): char is string => char !== null,
);

export const GOJUON_SET = new Set(GOJUON_ORDER);

type Position = {
  row: number;
  column: number;
};

const GOJUON_POSITIONS = new Map<string, Position>();

GOJUON_GRID.forEach((row, rowIndex) => {
  row.forEach((char, columnIndex) => {
    if (char !== null) {
      GOJUON_POSITIONS.set(char, { row: rowIndex, column: columnIndex });
    }
  });
});

export function adjacentCharacters(char: string): string[] {
  const position = GOJUON_POSITIONS.get(char);

  if (!position) {
    return [];
  }

  const result: string[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) {
        continue;
      }

      const neighbor =
        GOJUON_GRID[position.row + rowOffset]?.[position.column + columnOffset];

      if (neighbor) {
        result.push(neighbor);
      }
    }
  }

  return result;
}
