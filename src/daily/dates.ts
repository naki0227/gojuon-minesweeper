// Dates and links of 今日の一問 that the app needs. Kept apart from
// ./schedule, which bundles every coming day's answer.
import { SITE_URL } from "../links/site";

const JAPAN_OFFSET_MS = 9 * 60 * 60 * 1000;

// The calendar date in Japan (UTC+9, no daylight saving).
export function japanDate(now: Date): string {
  return new Date(now.getTime() + JAPAN_OFFSET_MS).toISOString().slice(0, 10);
}

// A new puzzle goes online every morning at 7:00 Japan time; until then
// the previous day's puzzle is still "today".
export const DAILY_RELEASE_HOUR = 7;

export function currentPuzzleDate(now: Date): string {
  return japanDate(
    new Date(now.getTime() - DAILY_RELEASE_HOUR * 60 * 60 * 1000),
  );
}

export function addDays(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(time).toISOString().slice(0, 10);
}

// "2026-10-14" -> "10/14"
export function shortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function dailyUrl(date: string): string {
  return `${SITE_URL}/daily/${date}/`;
}

// The プレゼント rules (scripts/daily/publish.ts writes the page).
export const GIFT_RULES_URL = `${SITE_URL}/daily/rules/`;
