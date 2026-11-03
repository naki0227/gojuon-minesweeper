/// <reference types="node" />
// Writes the 豆知識 for coming days of 今日の一問 that have none, with
// Claude Code (`claude -p`) on the signed-in Claude plan, and encrypts
// them back into schedule.upcoming.enc.
//   DAILY_SCHEDULE_KEY=... npx tsx scripts/daily/trivia.ts
// In Actions the CLI signs in with CLAUDE_CODE_OAUTH_TOKEN (made by
// `claude setup-token`). The repository is public, so the log shows dates
// only, never answers. A day Claude isn't sure about keeps no trivia.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { primaryAnswer } from "../../src/data/questions";
import releasedSchedule from "../../src/daily/schedule.json";
import {
  dailyQuestion,
  requireFullSchedule,
  writeUpcoming,
  type DailyEntry,
} from "../../src/daily/schedule";

const MIN_LENGTH = 30;
const MAX_LENGTH = 100;
const TIMEOUT_MS = 180_000;

const released = releasedSchedule as DailyEntry[];
const examples = released
  .map((entry) => entry.trivia)
  .filter((text): text is string => Boolean(text))
  .slice(-4);

const SYSTEM_PROMPT = `あなたは言葉当てパズル「今日の一問」の豆知識を書く担当です。答えが分かったあとに表示される、その言葉についての短い豆知識を1つ書きます。

- 50〜90字の日本語、です・ます調。子どもから大人まで読める言葉で。
- 辞書や百科事典で確かめられる、よく知られた事実だけを書く。数字・年・地名・由来は確実なものだけ。
- 少しでも自信がなければ confident を false にし、trivia は空にする。推測で書かない。
- 宣伝、特定の商品名、人を傷つける内容、政治的に対立のある話題は書かない。
- 返事は {"confident": true か false, "trivia": "..."} のJSONだけ。ほかの文は書かない。

これまでの例:
${examples.map((text) => `- ${text}`).join("\n")}`;

// An empty folder to run in, holding only the system prompt.
function promptDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "daily-trivia-"));
  writeFileSync(join(dir, "prompt.txt"), SYSTEM_PROMPT, "utf8");
  return dir;
}

function askClaude(dir: string, input: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(
      process.env.TRIVIA_CLAUDE_BIN ?? "claude",
      [
        "-p",
        "--tools",
        "",
        "--strict-mcp-config",
        "--disable-slash-commands",
        "--no-session-persistence",
        "--model",
        process.env.TRIVIA_MODEL ?? "opus",
        "--system-prompt-file",
        join(dir, "prompt.txt"),
      ],
      { cwd: dir },
    );
    let out = "";
    const timer = setTimeout(() => child.kill(), TIMEOUT_MS);
    child.stdout.on("data", (chunk: Buffer) => (out += chunk.toString("utf8")));
    child.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0 ? out : null);
    });
    child.stdin.end(input);
  });
}

// The trivia from Claude's JSON reply, or null when it is unsure, missing
// or not the right length.
export function readTrivia(reply: string): string | null {
  const json = reply.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as {
      confident?: unknown;
      trivia?: unknown;
    };
    if (parsed.confident !== true || typeof parsed.trivia !== "string") {
      return null;
    }
    const text = parsed.trivia.trim();
    const length = Array.from(text).length;
    return length >= MIN_LENGTH && length <= MAX_LENGTH ? text : null;
  } catch {
    return null;
  }
}

async function main() {
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && process.env.CI) {
    console.log("CLAUDE_CODE_OAUTH_TOKEN is not set; no trivia written.");
    return;
  }
  const dir = promptDir();
  const last = released.at(-1)?.date ?? "";
  const upcoming = requireFullSchedule().filter((entry) => entry.date > last);
  let changed = false;
  for (const entry of upcoming) {
    if (entry.trivia) continue;
    const question = dailyQuestion(entry);
    const answer = primaryAnswer(question);
    const reply = await askClaude(
      dir,
      `答え: ${answer.display}（読み: ${answer.value}）\nお題のカテゴリ: ${question.category}`,
    );
    const trivia = reply ? readTrivia(reply) : null;
    if (trivia) {
      entry.trivia = trivia;
      changed = true;
    }
    console.log(`${entry.date}: ${trivia ? "trivia written" : "no trivia"}`);
  }
  if (changed) writeUpcoming(upcoming);
}

if (process.argv[1]?.endsWith("trivia.ts")) void main();
