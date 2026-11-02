import {
  expandZeroArea,
  isAcceptedAnswer,
  isMineCharacter,
} from "../game/engine";
import { puzzleQuestion, type PuzzleEntry } from "./pack";

// One go at a 詰め五十音 puzzle. Every cell the player taps and every
// wrong answer is a move; cells that a zero opens around it are free.
export type PuzzlePlay = {
  entry: PuzzleEntry;
  opened: readonly string[];
  moves: number;
  wrong: readonly string[];
  status: "playing" | "solved" | "gaveUp";
};

export function startPuzzle(entry: PuzzleEntry): PuzzlePlay {
  return {
    entry,
    opened: entry.opened,
    moves: 0,
    wrong: [],
    status: "playing",
  };
}

export function openPuzzleCell(play: PuzzlePlay, char: string): PuzzlePlay {
  if (play.status !== "playing" || play.opened.includes(char)) return play;
  const question = puzzleQuestion(play.entry);
  const newly = isMineCharacter(question, char)
    ? [char]
    : expandZeroArea(question, char, play.opened);
  return { ...play, opened: [...play.opened, ...newly], moves: play.moves + 1 };
}

export function guessPuzzle(play: PuzzlePlay, text: string): PuzzlePlay {
  if (play.status !== "playing" || !text.trim()) return play;
  if (isAcceptedAnswer(puzzleQuestion(play.entry), text)) {
    return { ...play, status: "solved" };
  }
  return {
    ...play,
    moves: play.moves + 1,
    wrong: [...play.wrong, text.trim()],
  };
}

export function giveUpPuzzle(play: PuzzlePlay): PuzzlePlay {
  return play.status === "playing" ? { ...play, status: "gaveUp" } : play;
}

// 3 stars within par, 2 at one over, 1 for any other solve.
export function puzzleStars(play: PuzzlePlay): 0 | 1 | 2 | 3 {
  if (play.status !== "solved") return 0;
  if (play.moves <= play.entry.par) return 3;
  return play.moves === play.entry.par + 1 ? 2 : 1;
}
