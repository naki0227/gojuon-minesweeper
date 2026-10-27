import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { primaryAnswer, QUESTIONS } from "../src/data/questions";
import { consistentCandidates, samePromptPool } from "../src/daily/puzzle";
import { DAILY_SCHEDULE, dailyQuestion } from "../src/daily/schedule";
import { NO_STREAK, recordSolve } from "../src/daily/streak";
import { mergePlay, mergeStreak } from "../src/daily/widgetSync";
import {
  widgetChoices,
  widgetJson,
  type WidgetDay,
} from "../scripts/daily/widget";

describe("widget.json", () => {
  it("holds every cell's view, four choices and the answer's hash", () => {
    for (const entry of DAILY_SCHEDULE.slice(-14)) {
      const day = JSON.parse(widgetJson(entry)) as WidgetDay;
      const question = dailyQuestion(entry);
      const answer = primaryAnswer(question).display;
      expect(day.choices).toContain(answer);
      expect(new Set(day.choices).size).toBe(day.choices.length);
      expect(day.choices.length).toBe(4);
      expect(day.answer).toBe(
        createHash("sha256").update(`${entry.date}:${answer}`).digest("hex"),
      );
      const cells = day.rows.flat().filter((cell) => cell !== null);
      expect(Object.keys(day.cells).sort()).toEqual([...cells].sort());
      for (const view of Object.values(day.cells)) {
        expect(view).toMatch(/^[sm]\d$/);
      }
      expect(day.opened).toEqual(entry.opened);
    }
  });

  it("offers the words the starting board can't yet tell apart", () => {
    const entry = DAILY_SCHEDULE.at(-1)!;
    const question = dailyQuestion(entry);
    const close = consistentCandidates(
      question,
      samePromptPool(question, QUESTIONS),
      entry.opened,
    ).map((item) => primaryAnswer(item).display);
    const choices = widgetChoices(entry);
    for (const word of close.slice(0, 4)) expect(choices).toContain(word);
    expect(widgetChoices(entry)).toEqual(choices);
  });
});

describe("sharing the game with the widgets", () => {
  const playing = {
    date: "2026-10-25",
    opened: ["あ"],
    moves: ["safe" as const],
    phase: "playing" as const,
  };

  it("keeps the later day, then a finished game, then more moves", () => {
    const solved = { ...playing, phase: "solved" as const };
    const more = { ...playing, moves: [...playing.moves, "mine" as const] };
    const older = { ...more, date: "2026-10-24" };
    expect(mergePlay(null, playing)).toBe(playing);
    expect(mergePlay(older, playing)).toBe(playing);
    expect(mergePlay(more, solved)).toBe(solved);
    expect(mergePlay(playing, more)).toBe(more);
  });

  it("joins a streak continued in the other place", () => {
    let app = NO_STREAK;
    for (const date of ["2026-10-20", "2026-10-21", "2026-10-22"]) {
      app = recordSolve(app, date);
    }
    // The widget only knew an old streak, then solved the next day.
    const widget = recordSolve(NO_STREAK, "2026-10-23");
    expect(mergeStreak(app, widget)).toEqual({
      lastSolved: "2026-10-23",
      count: 4,
      best: 4,
    });
    expect(mergeStreak(widget, app)).toEqual(mergeStreak(app, widget));
    // Already shared: nothing doubles.
    const both = recordSolve(app, "2026-10-23");
    expect(mergeStreak(both, both)).toEqual(both);
    expect(mergeStreak(app, both)).toEqual(both);
    // A gap starts over.
    const later = recordSolve(NO_STREAK, "2026-10-25");
    expect(mergeStreak(app, later)).toEqual({
      lastSolved: "2026-10-25",
      count: 1,
      best: 3,
    });
    expect(mergeStreak(NO_STREAK, app)).toEqual(app);
  });
});
