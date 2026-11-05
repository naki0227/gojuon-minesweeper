import type { Question } from "../data/types";
import { expandZeroArea, isAcceptedAnswer, isMineCharacter } from "./engine";
import { safeHint } from "./hint";

// One player working out one word alone: 詰め五十音 and the custom
// question. Every cell the player taps and every wrong answer is a move;
// cells that a zero opens around it are free.
export type SoloPlay = {
  question: Question;
  opened: readonly string[];
  moves: number;
  wrong: readonly string[];
  status: "playing" | "solved" | "gaveUp";
  // Safe cells lit up by hints (rewarded ads).
  hints?: readonly string[];
};

export function startSolo(
  question: Question,
  opened: readonly string[] = [],
): SoloPlay {
  return { question, opened, moves: 0, wrong: [], status: "playing" };
}

export function openSoloCell(play: SoloPlay, char: string): SoloPlay {
  if (play.status !== "playing" || play.opened.includes(char)) return play;
  const newly = isMineCharacter(play.question, char)
    ? [char]
    : expandZeroArea(play.question, char, play.opened);
  return { ...play, opened: [...play.opened, ...newly], moves: play.moves + 1 };
}

export function guessSolo(play: SoloPlay, text: string): SoloPlay {
  if (play.status !== "playing" || !text.trim()) return play;
  if (isAcceptedAnswer(play.question, text)) {
    return { ...play, status: "solved" };
  }
  return {
    ...play,
    moves: play.moves + 1,
    wrong: [...play.wrong, text.trim()],
  };
}

export function giveUpSolo(play: SoloPlay): SoloPlay {
  return play.status === "playing" ? { ...play, status: "gaveUp" } : play;
}

// Lights up one more safe cell; nothing changes when none is left.
export function hintSolo(play: SoloPlay): SoloPlay {
  if (play.status !== "playing") return play;
  const char = safeHint(play.question, play.opened, play.hints);
  return char ? { ...play, hints: [...(play.hints ?? []), char] } : play;
}
