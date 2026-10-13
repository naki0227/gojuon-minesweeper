import type { EndlessState } from "./engine";

export type StingerKind = "start" | "clear" | "over";

// A moment worth a pause: a new question, a correct answer, or the last
// life lost. Each has its own key so it shows once and then waits for a tap.
export function stingerFor(
  game: EndlessState,
): { key: string; kind: StingerKind } | null {
  const id = game.question.id;
  if (game.phase === "cleared") {
    return { key: `clear:${id}:${game.solved}`, kind: "clear" };
  }
  if (game.phase === "revive") {
    return { key: `over:${id}:${game.revives}`, kind: "over" };
  }
  const fresh =
    game.phase === "answer" &&
    game.opened.length === 0 &&
    game.wrongGuesses === 0 &&
    game.hintUses === 0;
  return fresh ? { key: `start:${id}:${game.solved}`, kind: "start" } : null;
}
