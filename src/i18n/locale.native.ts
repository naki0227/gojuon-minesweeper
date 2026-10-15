import { getLocales } from "expo-localization";

import type { Locale } from "./locale";

// Japanese for devices set to Japanese, English for everything else.
function deviceLocale(): Locale {
  const preferred = getLocales()[0]?.languageCode;
  return preferred === "ja" ? "ja" : "en";
}

export type { Locale };
export const LOCALE: Locale = deviceLocale();
