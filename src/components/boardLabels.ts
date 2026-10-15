import { tr } from "../i18n";

// Screen reader suffixes for a board cell, appended after its character.
export const BOARD_LABELS = tr({
  ja: {
    hinted: " 安全ヒント",
    mine: (multiplicity: number) =>
      ` 地雷${multiplicity > 1 ? ` 答えに${multiplicity}回登場` : ""}`,
    safe: (mineCount: number | null) => ` セーフ 周囲の答え文字${mineCount}個`,
  },
  en: {
    hinted: ", safe hint",
    mine: (multiplicity: number) =>
      `, mine${multiplicity > 1 ? `, appears ${multiplicity} times in the answer` : ""}`,
    safe: (mineCount: number | null) =>
      `, safe, ${mineCount} ${mineCount === 1 ? "mine" : "mines"} nearby`,
  },
});
