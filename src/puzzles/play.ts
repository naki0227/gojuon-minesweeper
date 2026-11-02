import { startSolo, type SoloPlay } from "../game/solo";
import { puzzleQuestion, type PuzzleEntry } from "./pack";

export function startPuzzle(entry: PuzzleEntry): SoloPlay {
  return startSolo(puzzleQuestion(entry), entry.opened);
}

// 3 stars within par, 2 at one over, 1 for any other solve.
export function puzzleStars(play: SoloPlay, par: number): 0 | 1 | 2 | 3 {
  if (play.status !== "solved") return 0;
  if (play.moves <= par) return 3;
  return play.moves === par + 1 ? 2 : 1;
}
