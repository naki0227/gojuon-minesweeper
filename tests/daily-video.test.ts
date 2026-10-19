import { describe, expect, it } from "vitest";

import {
  DAILY_SCHEDULE,
  dailyEntry,
  dailyQuestion,
} from "../src/daily/schedule";
import { isMineCharacter } from "../src/game/engine";
import { ffmpegArgs } from "../scripts/daily/video/encode";
import { planVideos, weekPostText } from "../scripts/daily/video/texts";
import {
  answerTimeline,
  clock,
  hiddenAnswerLetters,
  lastFullWeek,
  openingOrder,
  questionTimeline,
  weekTimeline,
} from "../scripts/daily/video/timeline";

const entry = DAILY_SCHEDULE[1]!;

describe("daily video timelines", () => {
  it("opens the puzzle's cells, answer letters last, then asks for answers", () => {
    const timeline = questionTimeline(entry);
    const order = openingOrder(entry);
    expect([...order].sort()).toEqual([...entry.opened].sort());
    const mines = order.map((char) =>
      isMineCharacter(dailyQuestion(entry), char),
    );
    expect(mines.indexOf(true)).toBeGreaterThan(mines.lastIndexOf(false));
    expect(timeline.opens.map((open) => open.char)).toEqual(order);
    expect(timeline.ctaAt).toBeGreaterThan(timeline.opens.at(-1)!.at);
    expect(timeline.duration).toBeGreaterThan(timeline.ctaAt + 3);
    expect(timeline.cues).toHaveLength(order.length + 2);
  });

  it("reveals only the answer letters the puzzle kept hidden", () => {
    const hidden = hiddenAnswerLetters(entry);
    expect(hidden.length).toBeGreaterThan(0);
    for (const char of hidden) {
      expect(entry.opened).not.toContain(char);
      expect(isMineCharacter(dailyQuestion(entry), char)).toBe(true);
    }
    const timeline = answerTimeline(entry);
    expect(timeline.reveals.map((reveal) => reveal.char)).toEqual(hidden);
    expect(timeline.answerAt).toBeGreaterThan(timeline.reveals.at(-1)!.at);
    expect(timeline.cues.at(-1)?.sound).toBe("correct");
  });

  it("lays a week out back to back, thinking time before each answer", () => {
    const week = DAILY_SCHEDULE.slice(0, 6);
    const timeline = weekTimeline(week);
    expect(timeline.segments[0]!.start).toBe(timeline.introEnd);
    timeline.segments.forEach((segment, i) => {
      if (i > 0) expect(segment.start).toBe(timeline.segments[i - 1]!.end);
      expect(segment.thinkEnd - segment.thinkAt).toBeCloseTo(5);
      expect(segment.answer.reveals[0]?.at ?? Infinity).toBeGreaterThanOrEqual(
        segment.thinkEnd,
      );
    });
    expect(timeline.outroAt).toBe(timeline.segments.at(-1)!.end);
    // YouTube chapters need at least 10 s each.
    for (const segment of timeline.segments) {
      expect(segment.end - segment.start).toBeGreaterThanOrEqual(10);
    }
  });
});

describe("which videos are made", () => {
  it("takes the Monday–Sunday week before today's", () => {
    const dates = (today: string) =>
      lastFullWeek(DAILY_SCHEDULE, today).map((item) => item.date);
    expect(dates("2026-10-19")).toEqual([
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
    expect(dates("2026-10-25")).toEqual(dates("2026-10-19"));
    expect(dates("2026-10-18")).toEqual([]);
  });

  it("makes today's question and yesterday's answer, never a future answer", () => {
    const today = "2026-10-15";
    const released = DAILY_SCHEDULE.filter((item) => item.date <= today);
    const plan = planVideos(released, today);
    expect(plan.question?.date).toBe(today);
    expect(plan.answer?.date).toBe("2026-10-14");
    expect(plan.week).toEqual([]);
  });

  it("writes YouTube chapters starting at 0:00", () => {
    const week = lastFullWeek(DAILY_SCHEDULE, "2026-10-19");
    const { description } = weekPostText(week);
    expect(description.split("\n")[0]).toContain("/daily/");
    expect(description.split("\n")[1]).toContain("/yt");
    expect(description).toContain("0:00 オープニング");
    expect(description).toContain(`第1問 10/13`);
    expect(clock(75.4)).toBe("1:15");
  });
});

describe("ffmpeg arguments", () => {
  it("mixes the BGM with one delayed input per sound cue", () => {
    const timeline = answerTimeline(dailyEntry("2026-10-14")!);
    const args = ffmpegArgs({
      frames: "/tmp/f/%05d.jpg",
      fps: 30,
      duration: timeline.duration,
      cues: timeline.cues,
      soundDir: "/sounds",
      out: "/tmp/out.mp4",
    });
    expect(args.filter((arg) => arg === "-i")).toHaveLength(
      timeline.cues.length + 2,
    );
    const filter = args[args.indexOf("-filter_complex") + 1]!;
    const first = Math.round(timeline.cues[0]!.at * 1000);
    expect(filter).toContain(`adelay=${first}|${first}`);
    expect(filter).toContain(`amix=inputs=${timeline.cues.length + 1}`);
    expect(args.at(-1)).toBe("/tmp/out.mp4");
  });
});
