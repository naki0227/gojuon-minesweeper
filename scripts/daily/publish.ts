/// <reference types="node" />
// Writes the 今日の一問 site into the web export, for puzzles already
// released (7:00 Japan time) only: images, each day's page, puzzle.json
// (answer hashes for the プレゼント), app.json (the app's 今日の一問), the
// list, the posting kit and the day's videos (video/).
// Answers appear on a day's page from the next day on.
//   npx tsx scripts/daily/publish.ts [outDir=dist/daily]
// DAILY_TODAY=YYYY-MM-DD overrides today (for checking a build locally).
// Uses Chrome from the system (GitHub runners have it) or
// PLAYWRIGHT_CHROMIUM_PATH.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright-core";

import { currentPuzzleDate, DAILY_SCHEDULE } from "../../src/daily/schedule";
import { CARD_SIZES, cardHtml } from "./card";
import { puzzleJson } from "./lottery";
import { dayPage, kitPage, listPage, rulesPage } from "./pages";
import { planVideos } from "./video/texts";
import { renderDailyVideos } from "./video/videos";

async function main() {
  const outDir = process.argv[2] ?? "dist/daily";
  const today = process.env.DAILY_TODAY ?? currentPuzzleDate(new Date());
  const released = DAILY_SCHEDULE.filter((entry) => entry.date <= today);
  const current = released.at(-1);
  // The プレゼント box needs the project's Edge Functions.
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const lotteryEndpoint = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/daily-lottery`
    : undefined;

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await chromium.launch(
    executablePath ? { executablePath } : { channel: "chrome" },
  );
  for (const entry of released) {
    const dir = join(outDir, entry.date);
    mkdirSync(dir, { recursive: true });
    for (const size of CARD_SIZES) {
      const page = await browser.newPage({
        viewport: { width: size.width, height: size.height },
      });
      await page.setContent(cardHtml(entry, size));
      await page.screenshot({ path: join(dir, `${size.name}.png`) });
      await page.close();
    }
    writeFileSync(
      join(dir, "index.html"),
      dayPage(entry, entry.date < today, lotteryEndpoint),
    );
    writeFileSync(join(dir, "puzzle.json"), puzzleJson(entry));
    // For the app's 今日の一問 (src/daily/remote.ts).
    writeFileSync(
      join(dir, "app.json"),
      JSON.stringify({
        date: entry.date,
        questionId: entry.questionId,
        opened: entry.opened,
        trivia: entry.trivia,
      }),
    );
  }
  // Needs ffmpeg. DAILY_VIDEOS=0 skips the videos for a quick local check.
  const videos = planVideos(released, today);
  if (process.env.DAILY_VIDEOS !== "0") {
    await renderDailyVideos(browser, outDir, videos);
  }
  await browser.close();

  writeFileSync(join(outDir, "index.html"), listPage(released));
  mkdirSync(join(outDir, "rules"), { recursive: true });
  writeFileSync(join(outDir, "rules", "index.html"), rulesPage());
  if (current) {
    mkdirSync(join(outDir, "kit"), { recursive: true });
    writeFileSync(join(outDir, "kit", "index.html"), kitPage(current, videos));
  }
  console.log(`published ${released.length} days up to ${today}`);
}

void main();
