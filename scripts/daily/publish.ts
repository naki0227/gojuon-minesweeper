/// <reference types="node" />
// Writes the 今日の一問 site into the web export, for puzzles already
// released (7:00 Japan time) only: images, each day's page, the list and the posting kit.
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
import { dayPage, kitPage, listPage } from "./pages";

async function main() {
  const outDir = process.argv[2] ?? "dist/daily";
  const today = process.env.DAILY_TODAY ?? currentPuzzleDate(new Date());
  const released = DAILY_SCHEDULE.filter((entry) => entry.date <= today);
  const current = released.at(-1);

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
    writeFileSync(join(dir, "index.html"), dayPage(entry, entry.date < today));
  }
  await browser.close();

  writeFileSync(join(outDir, "index.html"), listPage(released));
  if (current) {
    mkdirSync(join(outDir, "kit"), { recursive: true });
    writeFileSync(join(outDir, "kit", "index.html"), kitPage(current));
  }
  console.log(`published ${released.length} days up to ${today}`);
}

void main();
