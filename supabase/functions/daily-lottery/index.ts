// 今日の一問 プレゼント (see the daily_lottery migration). Called by the
// static pages on minesweeper.enludus.com/daily/ without a login.
//   {action: "enter", date, answer, device} -> {correct, ticket, status, url?}
//   {action: "status", tickets}             -> {results: [{ticket, date, status, url?}]}
//   {action: "result", date, device, solved, moves} -> {stats}  (the app's 正解率)
//   {action: "stats", date}                 -> {stats}
// The answer is checked against /daily/<date>/puzzle.json, which the daily
// publish writes with hashes of the accepted answers (scripts/daily/lottery.ts).
import { createClient } from "npm:@supabase/supabase-js@2";

import { normalizeValue } from "../_shared/app/game/normalize.ts";

const SITE_URL = "https://minesweeper.enludus.com";
const REDEEM_URL =
  "https://apps.apple.com/redeem?ctx=offercodes&id=6819539119&code=";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

class ClientError extends Error {}

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// Same as currentPuzzleDate in src/daily/dates.ts: Japan time, and the
// day's puzzle runs from 7:00 to 7:00.
function currentPuzzleDate(now: Date): string {
  return new Date(now.getTime() + (9 - 7) * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(text: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}

// Device IDs and IPs are stored only as HMACs, keyed with a server secret.
const hmacKey = crypto.subtle.importKey(
  "raw", new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),
  { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
);
async function hmac(text: string): Promise<string> {
  return hex(await crypto.subtle.sign(
    "HMAC", await hmacKey, new TextEncoder().encode(text),
  ));
}

type Puzzle = { date: string; language: "ja" | "en"; answers: string[] };
const puzzles = new Map<string, Puzzle>();

async function loadPuzzle(date: string): Promise<Puzzle> {
  const cached = puzzles.get(date);
  if (cached) return cached;
  const response = await fetch(`${SITE_URL}/daily/${date}/puzzle.json`);
  const puzzle = response.ok ? await response.json() as Puzzle : null;
  if (!puzzle || puzzle.date !== date || !Array.isArray(puzzle.answers) ||
    (puzzle.language !== "ja" && puzzle.language !== "en")) {
    throw new ClientError("今日の問題を準備中です。少し待ってからもう一度送ってね。");
  }
  puzzles.set(date, puzzle);
  return puzzle;
}

// 8 characters without look-alikes (0/O, 1/I), shown as ABCD-EFGH.
function newTicket(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chars = Array.from(
    crypto.getRandomValues(new Uint8Array(8)),
    (byte) => alphabet[byte % alphabet.length],
  ).join("");
  return chars.slice(0, 4) + "-" + chars.slice(4);
}

function readString(value: unknown, max: number): string {
  return typeof value === "string" && value.length <= max ? value : "";
}

function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

async function enter(body: Record<string, unknown>, request: Request) {
  const date = readString(body.date, 10);
  const answer = readString(body.answer, 40);
  const device = readString(body.device, 64);
  if (!/^[A-Za-z0-9-]{16,64}$/.test(device) || !answer) {
    throw new ClientError("送信内容が正しくありません。");
  }
  if (date !== currentPuzzleDate(new Date())) {
    throw new ClientError("この問題の応募は締め切りました。今日の問題で応募してね。");
  }
  const puzzle = await loadPuzzle(date);
  const normalized = normalizeValue(answer, puzzle.language);
  if (!normalized || !puzzle.answers.includes(await sha256(`${date}:${normalized}`))) {
    return respond({ ok: true, correct: false });
  }
  const { data, error } = await admin.rpc("lottery_enter", {
    p_date: date,
    p_ticket: newTicket(),
    p_device_hash: await hmac("device:" + device),
    p_ip_hash: await hmac("ip:" + clientIp(request)),
  });
  if (error) {
    if (error.message.includes("Too many entries")) {
      throw new ClientError("このネットワークからの応募が多すぎます。また明日応募してね。");
    }
    throw error;
  }
  const entry = data as { ticket: string; won: boolean | null; code: string | null };
  return respond({
    ok: true,
    correct: true,
    ticket: entry.ticket,
    date,
    status: entry.code ? "won" : "pending",
    url: entry.code ? REDEEM_URL + entry.code : undefined,
  });
}

async function status(body: Record<string, unknown>) {
  const tickets = Array.isArray(body.tickets) ? body.tickets : [];
  const valid = tickets
    .map((ticket) => readString(ticket, 9).toUpperCase())
    .filter((ticket) => /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(ticket));
  if (valid.length === 0 || valid.length > 30 || valid.length !== tickets.length) {
    throw new ClientError("受け取り番号が正しくありません。");
  }
  const { data, error } = await admin.rpc("lottery_status", {
    p_today: currentPuzzleDate(new Date()),
    p_tickets: valid,
  });
  if (error) throw error;
  const results = (data as {
    ticket: string; date: string; status: string; code: string | null;
  }[]).map(({ code, ...result }) => ({
    ...result,
    url: code ? REDEEM_URL + code : undefined,
  }));
  return respond({ ok: true, results });
}

function addDays(date: string, days: number): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

type Stats = { players: number; solved: number; avgMoves: number | null };

// A finished game from the app, for today's or yesterday's puzzle (the app
// shows yesterday's until today's is online).
async function result(body: Record<string, unknown>, request: Request) {
  const date = readString(body.date, 10);
  const device = readString(body.device, 64);
  const moves = typeof body.moves === "number" ? Math.floor(body.moves) : -1;
  const today = currentPuzzleDate(new Date());
  if (
    !/^[A-Za-z0-9-]{16,64}$/.test(device) ||
    typeof body.solved !== "boolean" || moves < 0 || moves > 200 ||
    (date !== today && date !== addDays(today, -1))
  ) {
    throw new ClientError("送信内容が正しくありません。");
  }
  const { data, error } = await admin.rpc("daily_result_record", {
    p_date: date,
    p_device_hash: await hmac("device:" + device),
    p_ip_hash: await hmac("ip:" + clientIp(request)),
    p_solved: body.solved,
    p_moves: moves,
  });
  if (error) throw error;
  return respond({ ok: true, stats: data as Stats });
}

async function stats(body: Record<string, unknown>) {
  const date = readString(body.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > currentPuzzleDate(new Date())) {
    throw new ClientError("送信内容が正しくありません。");
  }
  const { data, error } = await admin.rpc("daily_result_stats", { p_date: date });
  if (error) throw error;
  return respond({ ok: true, stats: data as Stats });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (request.method !== "POST") return respond({ ok: false, error: "Method not allowed" }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = readString(body.action, 16);
    if (action === "enter") return await enter(body, request);
    if (action === "status") return await status(body);
    if (action === "result") return await result(body, request);
    if (action === "stats") return await stats(body);
    throw new ClientError("不明な操作です。");
  } catch (error) {
    if (error instanceof ClientError || error instanceof SyntaxError) {
      return respond({
        ok: false,
        error: error instanceof ClientError ? error.message : "送信内容が正しくありません。",
      }, 400);
    }
    // Never log answers, device IDs, IPs or codes.
    console.error(
      "daily-lottery failed",
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : (error as { message?: string })?.message ?? "unknown",
    );
    return respond({ ok: false, error: "処理できませんでした。少し待ってからもう一度試してね。" }, 500);
  }
});
