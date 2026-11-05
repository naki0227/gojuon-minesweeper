import { shuffled } from "../daily/puzzle";
import { GOJUON_GRID } from "../game/gojuon";
import { normalizeKana } from "../game/normalize";
import type { KidsWord } from "./words";

// One picture of こどもモード. The child opens the letters of the word on
// the 五十音 board in any order. A letter not in the word opens pale and
// costs nothing; after a few of those in a row the next letter glows.
export type KidsPlay = {
  word: KidsWord;
  // Board letters of the word, each once (ご is opened on こ).
  needed: readonly string[];
  opened: readonly string[];
  // Letters opened since the last one that was in the word.
  misses: number;
  cleared: boolean;
};

export const HINT_AFTER_MISSES = 3;

export function startKids(word: KidsWord): KidsPlay {
  return {
    word,
    needed: Array.from(new Set(Array.from(normalizeKana(word.reading)))),
    opened: [],
    misses: 0,
    cleared: false,
  };
}

export function openKids(play: KidsPlay, char: string): KidsPlay {
  if (play.cleared || play.opened.includes(char)) return play;
  const opened = [...play.opened, char];
  const hit = play.needed.includes(char);
  return {
    ...play,
    opened,
    misses: hit ? 0 : play.misses + 1,
    cleared: play.needed.every((letter) => opened.includes(letter)),
  };
}

// The letter that glows once the child has missed a few times.
export function kidsHint(play: KidsPlay): string | null {
  if (play.cleared || play.misses < HINT_AFTER_MISSES) return null;
  return play.needed.find((letter) => !play.opened.includes(letter)) ?? null;
}

// The word as boxes under the picture: each letter as written (ご, ょ),
// shown once its board letter is open.
export function kidsSlots(
  play: KidsPlay,
): { letter: string; shown: boolean }[] {
  return Array.from(play.word.reading).map((letter) => ({
    letter,
    shown: play.opened.includes(normalizeKana(letter)),
  }));
}

export type KidsGrid = ReadonlyArray<ReadonlyArray<string | null>>;

// バラバラ: the same board shape with the letters in a random order, so
// the child looks for the letter itself, not its place in the table.
export function kidsGrid(mixed: boolean, random: () => number): KidsGrid {
  if (!mixed) return GOJUON_GRID;
  const letters = shuffled(
    GOJUON_GRID.flat().filter((char): char is string => char !== null),
    random,
  );
  let next = 0;
  return GOJUON_GRID.map((row) =>
    row.map((char) => (char === null ? null : letters[next++]!)),
  );
}
