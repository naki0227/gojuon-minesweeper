// When things happen in the 今日の一問 videos, in seconds. Pure, so the
// pacing and the sound cues can be tested without rendering anything.
import { questionMineCharacters } from "../../../src/game/engine";
import {
  addDays,
  dailyQuestion,
  type DailyEntry,
} from "../../../src/daily/schedule";

export type SoundName = "open" | "mine" | "correct" | "start" | "tap";
export type Cue = { at: number; sound: SoundName; volume: number };
export type Reveal = { char: string; at: number };

const SOUND_VOLUME: Record<SoundName, number> = {
  open: 0.7,
  mine: 0.55,
  correct: 0.8,
  start: 0.7,
  tap: 0.6,
};

function cue(at: number, sound: SoundName): Cue {
  return { at: round(at), sound, volume: SOUND_VOLUME[sound] };
}

function round(seconds: number): number {
  return Math.round(seconds * 100) / 100;
}

// Opened cells, safe ones first so the answer letters come last.
export function openingOrder(entry: DailyEntry): string[] {
  const mines = questionMineCharacters(dailyQuestion(entry));
  return [
    ...entry.opened.filter((char) => !mines.has(char)),
    ...entry.opened.filter((char) => mines.has(char)),
  ];
}

// Answer letters the puzzle image did not show, in the answer's order.
export function hiddenAnswerLetters(entry: DailyEntry): string[] {
  const mines = questionMineCharacters(dailyQuestion(entry));
  return [...mines].filter((char) => !entry.opened.includes(char));
}

function reveals(
  chars: readonly string[],
  start: number,
  step: number,
): Reveal[] {
  return chars.map((char, i) => ({ char, at: round(start + i * step) }));
}

export type QuestionTimeline = {
  duration: number;
  promptAt: number;
  opens: Reveal[];
  ctaAt: number;
  cues: Cue[];
};

// Today's puzzle: the prompt, then its cells open one by one, then
// "comment your answer".
export function questionTimeline(entry: DailyEntry): QuestionTimeline {
  const promptAt = 0.3;
  const opens = reveals(openingOrder(entry), 1.4, 0.32);
  const ctaAt = round((opens.at(-1)?.at ?? 1.4) + 0.9);
  const mines = questionMineCharacters(dailyQuestion(entry));
  return {
    duration: round(ctaAt + 4.5),
    promptAt,
    opens,
    ctaAt,
    cues: [
      cue(promptAt, "start"),
      ...opens.map((open) =>
        cue(open.at, mines.has(open.char) ? "mine" : "open"),
      ),
      cue(ctaAt, "tap"),
    ],
  };
}

export type AnswerTimeline = {
  duration: number;
  reveals: Reveal[];
  answerAt: number;
  cues: Cue[];
};

// Yesterday's puzzle: the hidden answer letters light up, then the answer.
export function answerTimeline(entry: DailyEntry, start = 0): AnswerTimeline {
  const shown = reveals(hiddenAnswerLetters(entry), start + 2, 0.55);
  const answerAt = round((shown.at(-1)?.at ?? start + 2) + 1);
  return {
    duration: round(answerAt - start + (entry.trivia ? 6 : 4)),
    reveals: shown,
    answerAt,
    cues: [
      cue(start + 0.3, "start"),
      ...shown.map((reveal) => cue(reveal.at, "mine")),
      cue(answerAt, "correct"),
    ],
  };
}

export type WeekSegment = {
  entry: DailyEntry;
  start: number;
  thinkAt: number;
  thinkEnd: number;
  answerStart: number;
  answer: AnswerTimeline;
  end: number;
};

export type WeekTimeline = {
  duration: number;
  introEnd: number;
  segments: WeekSegment[];
  outroAt: number;
  cues: Cue[];
};

const WEEK_INTRO = 3.5;
const WEEK_THINK = 5;
const WEEK_OUTRO = 5;

// A week of puzzles: each one is shown, gets a few seconds to think, then
// its answer is revealed like the answer short.
export function weekTimeline(entries: readonly DailyEntry[]): WeekTimeline {
  let time = WEEK_INTRO;
  const segments = entries.map((entry) => {
    const start = time;
    const thinkAt = round(start + 1.2);
    const thinkEnd = round(thinkAt + WEEK_THINK);
    // answerTimeline starts revealing 2 s after its start.
    const answerStart = round(thinkEnd - 2);
    const answer = answerTimeline(entry, answerStart);
    const end = round(answer.answerAt + (entry.trivia ? 5.5 : 3.5));
    time = end;
    return { entry, start, thinkAt, thinkEnd, answerStart, answer, end };
  });
  return {
    duration: round(time + WEEK_OUTRO),
    introEnd: WEEK_INTRO,
    segments,
    outroAt: round(time),
    cues: [
      cue(0.4, "start"),
      ...segments.flatMap((segment) => [
        cue(segment.start + 0.2, "tap"),
        ...segment.answer.cues.filter((item) => item.sound !== "start"),
      ]),
      cue(time + 0.2, "start"),
    ],
  };
}

function weekdayIndex(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

// The Monday–Sunday week before the one `today` is in. Its answers are all
// out by Monday 7:00, when that Monday's puzzle becomes "today".
export function lastFullWeek(
  released: readonly DailyEntry[],
  today: string,
): DailyEntry[] {
  const thisMonday = addDays(today, -((weekdayIndex(today) + 6) % 7));
  const from = addDays(thisMonday, -7);
  return released.filter(
    (entry) => entry.date >= from && entry.date < thisMonday,
  );
}

// "0:03", "1:12" for YouTube chapters.
export function clock(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
