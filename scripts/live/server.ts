/// <reference types="node" />
// The live stream's local server: http://127.0.0.1:4173/ is the screen for
// the OBS browser source, /dev adds a comment box to try it without a
// stream. Run with `npm run live`.
import { createServer, type IncomingMessage } from "node:http";

import { askHost, fallbackLine, speak, type HostEvent } from "./host";
import { shellHtml, viewHtml } from "./page";
import { roundPrompt } from "./round";
import {
  addComment,
  answerOf,
  newSession,
  pickLiveQuestion,
  tick,
  type Session,
} from "./session";
import { followLiveChat, readToken } from "./youtube";

const PORT = Number(process.env.LIVE_PORT ?? 4173);
const USE_CLAUDE = process.env.LIVE_HOST !== "off";

let session: Session = newSession(pickLiveQuestion);
const voices = new Map<string, Buffer>();
let voiceId: string | null = null;
let hostQueue: Promise<void> = Promise.resolve();

// Lines are said one after another; Claude writes only the 正解 lines.
function host(event: HostEvent) {
  hostQueue = hostQueue.then(async () => {
    const line =
      USE_CLAUDE && event.kind === "solved"
        ? await askHost(event)
        : fallbackLine(event);
    session = { ...session, host: line };
    const wav = await speak(line);
    if (wav) {
      voiceId = `${Date.now()}`;
      voices.set(voiceId, wav);
      for (const id of voices.keys()) if (voices.size > 5) voices.delete(id);
    }
  });
}

export function handleComment(name: string, text: string) {
  const result = addComment(session, name, text, Date.now());
  session = result.session;
  if (result.event.kind === "solved") {
    host({
      kind: "solved",
      name: result.event.name,
      answer: answerOf(session),
      opened: session.round.opened.length,
      points: result.event.points,
    });
  }
}

setInterval(() => {
  const before = session;
  session = tick(session, Date.now(), pickLiveQuestion);
  if (before.nextAt === null && session.nextAt !== null) {
    host({ kind: "timeUp", answer: answerOf(before) });
  }
  if (session.roundNo !== before.roundNo) {
    host({
      kind: "newRound",
      prompt: roundPrompt(session.round),
      roundNo: session.roundNo,
    });
  }
}, 500);

const DEV_PAGE = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>ライブ テスト</title>
<style>body{font-family:sans-serif;margin:16px}iframe{width:1280px;height:720px;border:1px solid #ccc}form{margin:12px 0;display:flex;gap:8px}input{font-size:18px;padding:6px}</style></head>
<body><iframe src="/"></iframe><form id="f"><input id="n" value="テスト" size="10"><input id="t" placeholder="か / 答え：○○" size="30" autofocus><button>送る</button></form>
<script>document.getElementById("f").onsubmit=async(e)=>{e.preventDefault();const t=document.getElementById("t");
await fetch("/comment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:document.getElementById("n").value,text:t.value})});t.value="";};</script></body></html>`;

async function body(req: IncomingMessage): Promise<string> {
  let data = "";
  for await (const chunk of req) data += chunk;
  return data;
}

export function startServer() {
  const server = createServer(async (req, res) => {
    const url = req.url ?? "/";
    if (url === "/") {
      res
        .writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        .end(shellHtml());
    } else if (url === "/view") {
      const voice = voiceId ? `/voice/${voiceId}.wav` : null;
      res
        .writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
        .end(JSON.stringify({ html: viewHtml(session), voice }));
    } else if (url.startsWith("/voice/")) {
      const wav = voices.get(url.slice(7).replace(/\.wav$/, ""));
      if (wav) res.writeHead(200, { "Content-Type": "audio/wav" }).end(wav);
      else res.writeHead(404).end();
    } else if (url === "/dev") {
      res
        .writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        .end(DEV_PAGE);
    } else if (url === "/comment" && req.method === "POST") {
      try {
        const { name, text } = JSON.parse(await body(req)) as {
          name: string;
          text: string;
        };
        handleComment(String(name), String(text));
        res.writeHead(204).end();
      } catch {
        res.writeHead(400).end();
      }
    } else {
      res.writeHead(404).end();
    }
  });
  // Only this computer can reach it; OBS runs on the same machine.
  server.listen(PORT, "127.0.0.1", () => {
    console.log(
      `画面: http://127.0.0.1:${PORT}/  テスト: http://127.0.0.1:${PORT}/dev`,
    );
  });
}

startServer();

// With a token from `npm run live:auth`, comments come from the YouTube
// live chat; without one, only from /dev.
const youtube = readToken();
if (youtube) {
  console.log("YouTube のライブを待っています…");
  void followLiveChat(youtube, (comment) =>
    handleComment(comment.name, comment.text),
  );
} else {
  console.log("YouTube 未連携（npm run live:auth で連携できます）");
}
