// Every user-facing string lives next to the code that shows it, as a
// { ja, en } pair; `tr` picks the one for the device language.
//   const S = tr({ ja: { start: "スタート" }, en: { start: "Start" } });
import { LOCALE, type Locale } from "./locale";

export { LOCALE, type Locale };

export function tr<T>(table: { ja: T; en: T }): T {
  return table[LOCALE];
}
