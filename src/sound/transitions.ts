// Which sound a change in a game's board or result should make. Works on a
// small snapshot so local, online and endless games share the rules.
export type SoundName =
  "open" | "chain" | "mine" | "wrong" | "correct" | "start" | "over" | "tap";

export type SoundSnapshot = {
  // Changes when a new question starts; no sound is made across questions.
  key: string;
  opened: readonly string[];
  isMine: (char: string) => boolean;
  won: boolean;
  finished: boolean;
  message: string;
};

export function transitionSound(
  prev: SoundSnapshot | null,
  next: SoundSnapshot | null,
): SoundName | null {
  if (!prev || !next || prev.key !== next.key) return null;
  if (!prev.won && next.won) return "correct";
  const added = next.opened.filter((char) => !prev.opened.includes(char));
  if (added.some(next.isMine)) return "mine";
  if (!prev.finished && next.finished) return "over";
  if (added.length > 1) return "chain";
  if (added.length === 1) return "open";
  // Messages may be in either language (Endless shows the device's).
  if (next.message !== prev.message && /^(不正解|Wrong)/.test(next.message)) {
    return "wrong";
  }
  return null;
}
