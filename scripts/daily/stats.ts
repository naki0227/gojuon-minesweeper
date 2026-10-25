// The app players' 正解率 for a finished day, read from the daily-lottery
// Edge Function at publish time, for the answer pages and the answer short.
import { solveRateLine, type DailyStats } from "../../src/daily/gift";

export async function fetchSolveRate(
  endpoint: string | undefined,
  date: string,
): Promise<string | null> {
  if (!endpoint) return null;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "stats", date }),
    });
    const body = (await response.json()) as
      { ok: true; stats: DailyStats } | { ok: false };
    return body.ok ? solveRateLine(body.stats) : null;
  } catch {
    return null;
  }
}
