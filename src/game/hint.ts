import type { Question } from "../data/types";
import { getBoardOrder } from "./board";
import { adjacentMineCount, isMineCharacter } from "./engine";

// A safe cell to light up as a hint (the rewarded-ad hint): never an
// answer letter, and the one that tells the most, the closed safe cell
// with the most answer letters around it (board order on a tie).
export function safeHint(
  question: Question,
  opened: readonly string[],
  hinted: readonly string[] = [],
): string | null {
  let best: string | null = null;
  let bestCount = -1;
  for (const char of getBoardOrder(question.language)) {
    if (opened.includes(char) || hinted.includes(char)) continue;
    if (isMineCharacter(question, char)) continue;
    const count = adjacentMineCount(question, char);
    if (count > bestCount) {
      best = char;
      bestCount = count;
    }
  }
  return best;
}
