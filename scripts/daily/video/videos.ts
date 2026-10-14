/// <reference types="node" />
// Renders the 今日の一問 videos chosen by planVideos (texts.ts). Only the
// current ones are made, to keep the daily deploy quick: today's question,
// yesterday's answer and last week's roundup.
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import type { Browser } from "playwright-core";

import { renderVideo } from "./render";
import { answerVideoHtml, questionVideoHtml, weekVideoHtml } from "./slides";
import { videoPaths, type VideoPlan } from "./texts";
import { answerTimeline, questionTimeline, weekTimeline } from "./timeline";

export async function renderDailyVideos(
  browser: Browser,
  outDir: string,
  plan: VideoPlan,
) {
  const target = (path: string) => {
    const file = join(outDir, path);
    mkdirSync(join(file, ".."), { recursive: true });
    return file;
  };
  if (plan.question) {
    const timeline = questionTimeline(plan.question);
    await renderVideo(browser, {
      html: questionVideoHtml(plan.question, timeline),
      width: 1080,
      height: 1920,
      duration: timeline.duration,
      cues: timeline.cues,
      out: target(videoPaths.question(plan.question)),
    });
  }
  if (plan.answer) {
    const timeline = answerTimeline(plan.answer);
    await renderVideo(browser, {
      html: answerVideoHtml(plan.answer),
      width: 1080,
      height: 1920,
      duration: timeline.duration,
      cues: timeline.cues,
      out: target(videoPaths.answer(plan.answer)),
    });
  }
  if (plan.week.length > 0) {
    const timeline = weekTimeline(plan.week);
    await renderVideo(browser, {
      html: weekVideoHtml(timeline),
      width: 1920,
      height: 1080,
      duration: timeline.duration,
      cues: timeline.cues,
      out: target(videoPaths.week(plan.week)),
    });
  }
}
