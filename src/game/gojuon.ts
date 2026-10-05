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
