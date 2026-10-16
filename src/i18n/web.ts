import { SITE_URL } from "../links/site";
import { LOCALE } from "./index";

// Where each language's web build lives.
export const WEB_ROOTS = { ja: `${SITE_URL}/`, en: `${SITE_URL}/en/` };

// A page's own URL in this build's language, for canonical links.
export function pageUrl(path: string): string {
  return `${SITE_URL}${LOCALE === "en" ? "/en" : ""}${path}`;
}

// Remembered by the Cloudflare function in functions/index.ts, so "/"
// stops redirecting by browser language once someone picks one.
export function switchWebLanguage(to: "ja" | "en"): void {
  document.cookie = `lang=${to}; path=/; max-age=31536000; samesite=lax`;
  window.location.assign(WEB_ROOTS[to]);
}
