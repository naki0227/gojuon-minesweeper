// ffmpeg arguments for turning rendered frames into an mp4 with the game's
// BGM and sound effects (assets/sounds, the same sounds as the app).
import { join } from "node:path";

import type { Cue } from "./timeline";

export type EncodeJob = {
  frames: string; // printf pattern, e.g. /tmp/x/%05d.jpg
  fps: number;
  duration: number;
  cues: readonly Cue[];
  soundDir: string;
  out: string;
};

const BGM_VOLUME = 0.32;

export function ffmpegArgs(job: EncodeJob): string[] {
  const { duration } = job;
  const fadeStart = Math.max(0, duration - 1.2).toFixed(2);
  const inputs = [
    ["-framerate", String(job.fps), "-i", job.frames],
    ["-stream_loop", "-1", "-i", join(job.soundDir, "bgm.mp3")],
    ...job.cues.map((cue) => ["-i", join(job.soundDir, `${cue.sound}.mp3`)]),
  ].flat();

  const bgm = `[1:a]volume=${BGM_VOLUME},atrim=0:${duration},afade=t=in:d=0.6,afade=t=out:st=${fadeStart}:d=1.2[bgm]`;
  const effects = job.cues.map((cue, i) => {
    const ms = Math.round(cue.at * 1000);
    return `[${i + 2}:a]adelay=${ms}|${ms},volume=${cue.volume}[c${i}]`;
  });
  const mixInputs = ["[bgm]", ...job.cues.map((_, i) => `[c${i}]`)].join("");
  const mix = `${mixInputs}amix=inputs=${job.cues.length + 1}:duration=first:normalize=0,alimiter=limit=0.95[a]`;

  return [
    "-y",
    "-loglevel",
    "error",
    ...inputs,
    "-filter_complex",
    [bgm, ...effects, mix].join(";"),
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(job.fps),
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-t",
    String(duration),
    "-movflags",
    "+faststart",
    job.out,
  ];
}
