// Japanese categories that were split into narrower ones (2026-10). Saved
// filters and older apps in online matches may still send the old names,
// so a filter naming one of them means all of its successors.
export const LEGACY_CATEGORIES: Readonly<Record<string, readonly string[]>> = {
  食べ物: ["料理", "お菓子", "果物", "野菜", "食材", "調味料", "飲み物"],
  生活用品: ["日用品", "台所用品", "掃除・洗濯", "家具・家電", "工具"],
  体: ["体の部位"],
  動き: ["動詞"],
  ようす: ["形容詞", "様子を表す言葉"],
  ことば: [
    "人・家族",
    "交通・道路",
    "建物・施設",
    "家のつくり",
    "自然・風景",
    "時間・こよみ",
    "健康・病気",
    "気持ち",
    "性格",
    "仕事・会社",
    "趣味・アウトドア",
    "舞台・芸能",
    "音楽",
  ],
};

export function expandLegacyCategories(
  categories: readonly string[],
): readonly string[] {
  return categories.flatMap(
    (category) => LEGACY_CATEGORIES[category] ?? [category],
  );
}
