// The UI language, fixed for the app's lifetime. This default is used on
// the web, which is exported as static Japanese pages, and in tests;
// locale.native.ts follows the device language.
export type Locale = "ja" | "en";

export const LOCALE: Locale = "ja";
