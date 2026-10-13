/// <reference types="node" />
// Renders the 今日の一問 images for the days around today.
//   npx tsx scripts/daily/render.ts <outDir> [daysBefore=7] [daysAfter=7]
// Writes <outDir>/<date>/{square,feed,story}.png. Uses Chrome from the
// system (GitHub runners have it) or PLAYWRIGHT_CHROMIUM_PATH.
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright-core";

import { addDays, DAILY_SCHEDULE, japanDate } from "../../src/daily/schedule";
import { CARD_SIZES, cardHtml } from "./card";

const [outDir = "dist/daily", before = "7", after = "7"] =
  process.argv.slice(2);
const today = japanDate(new Date());
const from = addDays(today, -Number(before));
const to = addDays(today, Number(after));
const entries = DAILY_SCHEDULE.filter(
  (entry) => entry.date >= from && entry.date <= to,
);

async function main() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await chromium.launch(
    executablePath ? { executablePath } : { channel: "chrome" },
  );
  for (const entry of entries) {
    mkdirSync(join(outDir, entry.date), { recursive: true });
    for (const size of CARD_SIZES) {
      const page = await browser.newPage({
        viewport: { width: size.width, height: size.height },
      });
      await page.setContent(cardHtml(entry, size));
      await page.screenshot({
        path: join(outDir, entry.date, `${size.name}.png`),
      });
      await page.close();
    }
    console.log("rendered", entry.date);
  }
  await browser.close();
}

void main();
