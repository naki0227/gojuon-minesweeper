// The live stream's state across puzzles: the current round, the score
// board, the last few chat events and the host's line. Time is passed in,
// so the flow can be tested without waiting.
import { pickRandomQuestion, primaryAnswer } from "../../src/data/questions";
import type { Question } from "../../src/data/types";
import {
  applyComment,
  isBoardDone,
  newRound,
  type Round,
  type RoundEvent,
} from "./round";

export type Session = {
  round: Round;
  roundNo: number;
  scores: ReadonlyMap<string, number>;
  log: readonly string[];
  host: string;
  // When the next puzzle starts, once this one is over.
  nextAt: number | null;
  // When the board ran out of safe cells with nobody right yet.
  doneAt: number | null;
};

export const NEXT_DELAY = 8_000;
export const GIVE_UP_DELAY = 45_000;
const LOG_SIZE = 6;

export type PickQuestion = (excludeId?: string) => Question;

export const pickLiveQuestion: PickQuestion = (excludeId) =>
  pickRandomQuestion(
    { language: "ja", categories: [], length: "any" },
    excludeId,
  )!;

export function newSession(pick: PickQuestion): Session {
  return {
    round: newRound(pick()),
    roundNo: 1,
    scores: new Map(),
    log: [],
    host: "コメントで盤面を開けて、答えを当ててね！",
    nextAt: null,
    doneAt: null,
  };
}

function logLine(event: RoundEvent): string | null {
  switch (event.kind) {
    case "open":
      return event.mine
        ? `${event.name}：「${event.char}」🟧 答えに入ってる！`
        : `${event.name}：「${event.char}」を開けた（${event.count}）`;
    case "wrong":
      return `${event.name}：「${event.guess}」✗`;
    case "solved":
      return `${event.name}：正解！ +${event.points}点 🎉`;
    case "none":
      return null;
  }
}

export function addComment(
  session: Session,
  name: string,
  text: string,
  now: number,
): { session: Session; event: RoundEvent } {
  const { round, event } = applyComment(session.round, name, text);
  const line = logLine(event);
  if (line === null) return { session, event };
  const next: Session = {
    ...session,
    round,
    log: [...session.log, line].slice(-LOG_SIZE),
  };
  if (event.kind === "solved") {
    const scores = new Map(session.scores);
    scores.set(event.name, (scores.get(event.name) ?? 0) + event.points);
    return { session: { ...next, scores, nextAt: now + NEXT_DELAY }, event };
  }
  if (next.doneAt === null && isBoardDone(round)) {
    return { session: { ...next, doneAt: now }, event };
  }
  return { session: next, event };
}

export function answerOf(session: Session): string {
  return primaryAnswer(session.round.question).display;
}

// Moves the stream on: nobody got it in time, or the next puzzle is due.
export function tick(
  session: Session,
  now: number,
  pick: PickQuestion,
): Session {
  if (session.nextAt === null && session.doneAt !== null) {
    if (now - session.doneAt < GIVE_UP_DELAY) return session;
    return {
      ...session,
      log: [...session.log, `正解は「${answerOf(session)}」でした`].slice(
        -LOG_SIZE,
      ),
      nextAt: now + NEXT_DELAY,
    };
  }
  if (session.nextAt === null || now < session.nextAt) return session;
  return {
    ...session,
    round: newRound(pick(session.round.question.id)),
    roundNo: session.roundNo + 1,
    log: [],
    nextAt: null,
    doneAt: null,
  };
}

export function topScores(
  session: Session,
  count = 5,
): Array<{ name: string; points: number }> {
  return [...session.scores]
    .map(([name, points]) => ({ name, points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, count);
}
