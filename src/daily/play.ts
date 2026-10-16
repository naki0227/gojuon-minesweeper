// 今日の一問 played in the app: one player, the board from the day's
// image to start with. Open cells for clues or guess at any time; the
// moves make the shareable result line.
import type { Question } from "../data/types";
import {
  expandZeroArea,
  isAcceptedAnswer,
  isMineCharacter,
} from "../game/engine";
import { shortDate } from "./schedule";

export type DailyMove = "safe" | "mine" | "wrong" | "correct";

export type DailyPlay = {
  date: string;
  question: Question;
  opened: readonly string[];
  moves: readonly DailyMove[];
  phase: "playing" | "solved" | "gaveUp";
};

// What is saved on the device to resume the day's game.
export type SavedPlay = Pick<DailyPlay, "date" | "opened" | "moves" | "phase">;

export function startDaily(
  date: string,
  question: Question,
  opened: readonly string[],
  saved?: SavedPlay | null,
): DailyPlay {
  if (saved && saved.date === date) {
    return { ...saved, question };
  }
  return { date, question, opened, moves: [], phase: "playing" };
}

export function openDaily(play: DailyPlay, char: string): DailyPlay {
  if (play.phase !== "playing" || play.opened.includes(char)) return play;
  if (isMineCharacter(play.question, char)) {
    return {
      ...play,
      opened: [...play.opened, char],
      moves: [...play.moves, "mine"],
    };
  }
  const newly = expandZeroArea(play.question, char, play.opened);
  return {
    ...play,
    opened: [...play.opened, ...newly],
    moves: [...play.moves, "safe"],
  };
}

export function guessDaily(play: DailyPlay, input: string): DailyPlay {
  if (play.phase !== "playing" || !input.trim()) return play;
  const correct = isAcceptedAnswer(play.question, input);
  return {
    ...play,
    phase: correct ? "solved" : "playing",
    moves: [...play.moves, correct ? "correct" : "wrong"],
  };
}

export function giveUpDaily(play: DailyPlay): DailyPlay {
  return play.phase === "playing" ? { ...play, phase: "gaveUp" } : play;
}

const MOVE_EMOJI: Record<DailyMove, string> = {
  safe: "🟦",
  mine: "🟧",
  wrong: "❌",
  correct: "✅",
};

// "🟦🟦🟧❌✅" — no letters, so it never gives the answer away.
export function movesLine(moves: readonly DailyMove[]): string {
  return moves.map((move) => MOVE_EMOJI[move]).join("");
}

export function dailyShareText(
  play: DailyPlay,
  streak: number,
  url: string,
): string {
  const head =
    play.phase === "solved"
      ? `今日の一問 ${shortDate(play.date)} 正解！`
      : `今日の一問 ${shortDate(play.date)} ギブアップ…`;
  return [
    head,
    movesLine(play.moves) || "（ノーヒント）",
    streak > 1 ? `🔥${streak}日連続` : "",
    `${url} #五十音マインスイーパー #今日の一問`,
  ]
    .filter(Boolean)
    .join("\n");
}
