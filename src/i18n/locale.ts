// The UI language, fixed for the app's lifetime. On the web it is fixed
// per build: Japanese at /, English at /en/ (EXPO_PUBLIC_LOCALE=en, see
// deploy-web.yml). locale.native.ts follows the device language.
export type Locale = "ja" | "en";

export const LOCALE: Locale =
  process.env.EXPO_PUBLIC_LOCALE === "en" ? "en" : "ja";
