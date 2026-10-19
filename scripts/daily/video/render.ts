/// <reference types="node" />
// Renders a video page frame by frame with Chrome, then encodes it with
// ffmpeg. Frames that look the same as the previous one are hard links,
// so still stretches cost almost nothing.
import { spawnSync } from "node:child_process";
import { linkSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Browser } from "playwright-core";

import { ffmpegArgs } from "./encode";
import type { Cue } from "./timeline";

export type VideoJob = {
  html: string;
  width: number;
  height: number;
  duration: number;
  cues: readonly Cue[];
  out: string;
};

const FPS = 30;
const SOUND_DIR = join(__dirname, "..", "..", "..", "assets", "sounds");

declare global {
  interface Window {
    renderAt(t: number): string;
  }
}

export async function renderVideo(browser: Browser, job: VideoJob) {
  const dir = mkdtempSync(join(tmpdir(), "daily-video-"));
  const page = await browser.newPage({
    viewport: { width: job.width, height: job.height },
  });
  try {
    await page.setContent(job.html);
    await page.evaluate(() => document.fonts.ready);
    const frames = Math.ceil(job.duration * FPS);
    let previous = "";
    let previousFile = "";
    for (let i = 0; i < frames; i++) {
      const file = join(dir, `${String(i).padStart(5, "0")}.jpg`);
      const signature = await page.evaluate((t) => window.renderAt(t), i / FPS);
      if (signature === previous && previousFile) {
        linkSync(previousFile, file);
      } else {
        await page.screenshot({ path: file, type: "jpeg", quality: 92 });
        previous = signature;
        previousFile = file;
      }
    }
    const result = spawnSync(
      "ffmpeg",
      ffmpegArgs({
        frames: join(dir, "%05d.jpg"),
        fps: FPS,
        duration: job.duration,
        cues: job.cues,
        soundDir: SOUND_DIR,
        out: job.out,
      }),
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      throw new Error(`ffmpeg failed for ${job.out}`);
    }
  } finally {
    await page.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

// One frame of a page, long after every element has popped in.
export async function renderStill(
  browser: Browser,
  job: { html: string; width: number; height: number; out: string },
) {
  const page = await browser.newPage({
    viewport: { width: job.width, height: job.height },
  });
  try {
    await page.setContent(job.html);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.renderAt(3600));
    await page.screenshot({ path: job.out, type: "jpeg", quality: 92 });
  } finally {
    await page.close();
  }
}
