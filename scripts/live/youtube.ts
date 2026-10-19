/// <reference types="node" />
// Reads the live chat of the channel's current broadcast and hands each
// comment to the game. The OAuth token comes from `npm run live:auth` and
// stays on this computer (.live/, ignored by git).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const LIVE_DIR = join(__dirname, "..", "..", ".live");
export const TOKEN_FILE = join(LIVE_DIR, "youtube-token.json");
const API = "https://www.googleapis.com/youtube/v3";

export type StoredToken = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export type ChatComment = { id: string; name: string; text: string };

type ChatResponse = {
  nextPageToken?: string;
  pollingIntervalMillis?: number;
  offlineAt?: string;
  items?: Array<{
    id: string;
    snippet?: { type?: string; displayMessage?: string };
    authorDetails?: { displayName?: string };
  }>;
};

// Plain text comments only; Super Chats, joins and deletions are skipped.
export function chatComments(response: ChatResponse): ChatComment[] {
  return (response.items ?? []).flatMap((item) =>
    item.snippet?.type === "textMessageEvent" && item.snippet.displayMessage
      ? [
          {
            id: item.id,
            name: item.authorDetails?.displayName ?? "",
            text: item.snippet.displayMessage,
          },
        ]
      : [],
  );
}

// Each read costs quota (10,000 units a day by default), so chat is read
// at most every LIVE_CHAT_INTERVAL ms even when YouTube allows sooner.
export function nextPollDelay(response: ChatResponse): number {
  const floor = Number(process.env.LIVE_CHAT_INTERVAL ?? 5_000);
  return Math.max(floor, response.pollingIntervalMillis ?? 0);
}

export function readToken(): StoredToken | null {
  if (!existsSync(TOKEN_FILE)) return null;
  return JSON.parse(readFileSync(TOKEN_FILE, "utf8")) as StoredToken;
}

let cached: { value: string; expiresAt: number } | null = null;

async function accessToken(token: StoredToken): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: token.clientId,
      client_secret: token.clientSecret,
      refresh_token: token.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status}`);
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cached = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cached.value;
}

async function api<T>(token: StoredToken, path: string): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    headers: { Authorization: `Bearer ${await accessToken(token)}` },
  });
  if (!res.ok)
    throw new Error(`YouTube API ${path.split("?")[0]}: ${res.status}`);
  return (await res.json()) as T;
}

// The chat of the channel's broadcast that is live now, if any.
export async function activeChatId(token: StoredToken): Promise<string | null> {
  const data = await api<{
    items?: Array<{ snippet?: { liveChatId?: string } }>;
  }>(
    token,
    "liveBroadcasts?part=snippet&broadcastStatus=active&broadcastType=all",
  );
  return data.items?.[0]?.snippet?.liveChatId ?? null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Waits for a broadcast to go live, then passes its new comments on until
// it ends, and starts waiting again. Comments from before the server
// started are skipped.
export async function followLiveChat(
  token: StoredToken,
  onComment: (comment: ChatComment) => void,
  log: (message: string) => void = console.log,
): Promise<never> {
  for (;;) {
    try {
      const chatId = await activeChatId(token);
      if (chatId === null) {
        await sleep(60_000);
        continue;
      }
      log("ライブを見つけた。チャットを読み始めます");
      const base = `liveChat/messages?part=snippet,authorDetails&maxResults=200&liveChatId=${chatId}`;
      // The first page is what was said before; only later pages are new.
      let page = await api<ChatResponse>(token, base);
      const seen = new Set(chatComments(page).map((comment) => comment.id));
      while (!page.offlineAt) {
        await sleep(nextPollDelay(page));
        const pageToken = page.nextPageToken;
        page = await api<ChatResponse>(
          token,
          pageToken ? `${base}&pageToken=${pageToken}` : base,
        );
        for (const comment of chatComments(page)) {
          if (seen.has(comment.id)) continue;
          seen.add(comment.id);
          onComment(comment);
        }
      }
      log("ライブが終わった");
    } catch (error) {
      log(`チャットの読み込みでエラー: ${(error as Error).message}`);
      await sleep(60_000);
    }
  }
}
