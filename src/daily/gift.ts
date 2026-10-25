// The 今日の一問 プレゼント from the app: the same daily-lottery Edge
// Function the web pages use (supabase/functions/daily-lottery).
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const ENDPOINT = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/daily-lottery`
  : "";

export const giftAvailable = ENDPOINT.length > 0;

export type GiftResult = {
  ticket: string;
  date: string;
  status: "pending" | "won" | "lost" | "expired";
  url?: string;
};

type Response<T> = ({ ok: true } & T) | { ok: false; error: string };

async function call<T>(body: object): Promise<Response<T>> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as Response<T>;
  } catch {
    return { ok: false, error: "通信できませんでした。" };
  }
}

export function enterGift(date: string, answer: string, device: string) {
  return call<{ correct: false } | ({ correct: true } & GiftResult)>({
    action: "enter",
    date,
    answer,
    device,
  });
}

export function giftResults(tickets: string[]) {
  return call<{ results: GiftResult[] }>({ action: "status", tickets });
}

// A random ID for this install, made once and kept in daily storage. It
// only tells entries apart (one per device per day), so Math.random is
// enough.
export function newDeviceId(): string {
  let id = Date.now().toString(36);
  while (id.length < 32) id += Math.random().toString(36).slice(2);
  return id.slice(0, 32);
}

// 今日の一問 正解率: totals of the app players' first results for a day.
export type DailyStats = {
  players: number;
  solved: number;
  avgMoves: number | null;
};

// Reports this device's finished game (only its first result counts) and
// gets the day's totals back.
export function reportDaily(
  date: string,
  device: string,
  solved: boolean,
  moves: number,
) {
  return call<{ stats: DailyStats }>({
    action: "result",
    date,
    device,
    solved,
    moves,
  });
}

// "今日の正解率 23%（120人中）・正解した人は平均4.2手". Few players make a
// rate that jumps around, so it waits for 5.
export function solveRateLine(stats: DailyStats): string | null {
  if (stats.players < 5) return null;
  const rate = Math.round((stats.solved / stats.players) * 100);
  const moves =
    stats.avgMoves !== null && stats.solved > 0
      ? `・正解した人は平均${stats.avgMoves}手`
      : "";
  return `正解率 ${rate}%（${stats.players}人中）${moves}`;
}
