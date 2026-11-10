// Engine messages name "Player 1/2". A match against the bot shows its own
// labels instead ("You" / "Bot (Hard)"), so English verbs written for a
// third person are fixed when the label is "You" ("You go first").
export function nameSides(
  message: string,
  labels: readonly [string, string],
): string {
  return message
    .replaceAll("Player 1", labels[0])
    .replaceAll("Player 2", labels[1])
    .replace(/\bYou's turn\b/g, "Your turn")
    .replace(/\bYou to answer\b/g, "Your turn to answer")
    .replace(/\bYou (goes|skips|wins)\b/g, (_match, verb: string) =>
      verb === "goes" ? "You go" : `You ${verb.slice(0, -1)}`,
    );
}
