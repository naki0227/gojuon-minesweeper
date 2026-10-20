import { tr } from "../i18n";
import type { LengthRange } from "./types";

const S = tr({
  ja: {
    all: "ぜんぶ",
    short: "短い",
    shortNote: "2〜4字",
    normal: "ふつう",
    normalNote: "5〜7字",
    long: "長い",
    longNote: "8字〜",
  },
  en: {
    all: "All",
    short: "Short",
    shortNote: "2–4 letters",
    normal: "Medium",
    normalNote: "5–7 letters",
    long: "Long",
    longNote: "8+ letters",
  },
});

// Word-length choices on the home screen.
export type LengthPreset = {
  id: string;
  label: string;
  note: string | null;
  range: "any" | LengthRange;
};

export const LENGTH_PRESETS: readonly LengthPreset[] = [
  { id: "any", label: S.all, note: null, range: "any" },
  { id: "short", label: S.short, note: S.shortNote, range: { min: 2, max: 4 } },
  {
    id: "normal",
    label: S.normal,
    note: S.normalNote,
    range: { min: 5, max: 7 },
  },
  { id: "long", label: S.long, note: S.longNote, range: { min: 8, max: null } },
];
