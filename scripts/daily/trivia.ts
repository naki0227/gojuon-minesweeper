/// <reference types="node" />
// Writes the 豆知識 for coming days of 今日の一問 that have none, with
// Claude, and encrypts them back into schedule.upcoming.enc.
//   DAILY_SCHEDULE_KEY=... ANTHROPIC_API_KEY=... npx tsx scripts/daily/trivia.ts
// The repository is public, so the log shows dates only, never answers.
// A day Claude isn't sure about keeps no trivia rather than a guess.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

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

const Trivia = z.object({
  // False when no fact about the word is certain enough to print.
  confident: z.boolean(),
  trivia: z.string(),
});

const released = releasedSchedule as DailyEntry[];
const examples = released
  .map((entry) => entry.trivia)
  .filter((text): text is string => Boolean(text))
  .slice(-4);

const SYSTEM = `あなたは言葉当てパズル「今日の一問」の豆知識を書く担当です。答えが分かったあとに表示される、その言葉についての短い豆知識を1つ書きます。

- 50〜90字の日本語、です・ます調。子どもから大人まで読める言葉で。
- 辞書や百科事典で確かめられる、よく知られた事実だけを書く。数字・年・地名・由来は確実なものだけ。
- 少しでも自信がなければ confident を false にし、trivia は空にする。推測で書かない。
- 宣伝、特定の商品名、人を傷つける内容、政治的に対立のある話題は書かない。

これまでの例:
${examples.map((text) => `- ${text}`).join("\n")}`;

async function writeTrivia(
  client: Anthropic,
  entry: DailyEntry,
): Promise<string | null> {
  const question = dailyQuestion(entry);
  const answer = primaryAnswer(question);
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    // On a refusal, the request is re-run on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Trivia) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `答え: ${answer.display}（読み: ${answer.value}）\nお題のカテゴリ: ${question.category}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  const result = response.parsed_output;
  if (!result?.confident) return null;
  const text = result.trivia.trim();
  return text.length >= MIN_LENGTH && text.length <= MAX_LENGTH ? text : null;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("ANTHROPIC_API_KEY is not set; no trivia written.");
    return;
  }
  const client = new Anthropic();
  const last = released.at(-1)?.date ?? "";
  const upcoming = requireFullSchedule().filter((entry) => entry.date > last);
  let changed = false;
  for (const entry of upcoming) {
    if (entry.trivia) continue;
    // A failed request only leaves that day without trivia.
    const trivia = await writeTrivia(client, entry).catch((error: unknown) => {
      console.log(`${entry.date}: request failed (${String(error)})`);
      return null;
    });
    if (trivia) {
      entry.trivia = trivia;
      changed = true;
    }
    console.log(`${entry.date}: ${trivia ? "trivia written" : "no trivia"}`);
  }
  if (changed) writeUpcoming(upcoming);
}

void main();
