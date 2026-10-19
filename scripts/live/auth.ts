/// <reference types="node" />
// One-time sign-in so the live server can read the channel's live chat:
//   npm run live:auth -- path/to/client_secret.json
// The JSON is the "Desktop app" OAuth client from Google Cloud. Only
// read access to YouTube is asked for, and the token is saved in .live/.
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { LIVE_DIR, TOKEN_FILE, type StoredToken } from "./youtube";

const SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

function openBrowser(url: string) {
  const [command, args] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url.replace(/&/g, "^&")]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  spawn(command, args, { stdio: "ignore", detached: true }).on(
    "error",
    () => {},
  );
}

async function main() {
  const file = process.argv[2] ?? process.env.LIVE_GOOGLE_CLIENT;
  if (!file) throw new Error("client_secret.json の場所を指定してね");
  const client = (
    JSON.parse(readFileSync(file, "utf8")) as {
      installed: { client_id: string; client_secret: string };
    }
  ).installed;

  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("hex");

  const code = await new Promise<{ code: string; redirect: string }>(
    (resolve, reject) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        const got = url.searchParams.get("code");
        if (url.searchParams.get("state") !== state || !got) {
          res.writeHead(400).end("サインインできませんでした");
          server.close();
          reject(new Error(url.searchParams.get("error") ?? "bad response"));
          return;
        }
        res
          .writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
          .end("サインインできました。このタブは閉じてOKです。");
        server.close();
        resolve({ code: got, redirect });
      });
      let redirect = "";
      server.listen(0, "127.0.0.1", () => {
        redirect = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
        const url =
          "https://accounts.google.com/o/oauth2/v2/auth?" +
          new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: redirect,
            response_type: "code",
            scope: SCOPE,
            access_type: "offline",
            prompt: "consent",
            state,
            code_challenge: challenge,
            code_challenge_method: "S256",
          }).toString();
        console.log(`ブラウザでサインインしてね:\n${url}`);
        openBrowser(url);
      });
    },
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: client.client_id,
      client_secret: client.client_secret,
      code: code.code,
      code_verifier: verifier,
      redirect_uri: code.redirect,
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json()) as { refresh_token?: string };
  if (!res.ok || !data.refresh_token) {
    throw new Error(`トークンを受け取れませんでした (${res.status})`);
  }
  const token: StoredToken = {
    clientId: client.client_id,
    clientSecret: client.client_secret,
    refreshToken: data.refresh_token,
  };
  mkdirSync(LIVE_DIR, { recursive: true });
  writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2), { mode: 0o600 });
  console.log(`保存しました: ${TOKEN_FILE}`);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
