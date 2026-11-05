import { describe, expect, it } from "vitest";

import { GOJUON_GRID, GOJUON_SET } from "../src/game/gojuon";
import { normalizeKana } from "../src/game/normalize";
import {
  HINT_AFTER_MISSES,
  kidsGrid,
  kidsHint,
  kidsSlots,
  openKids,
  startKids,
} from "../src/kids/play";
import { KIDS_WORDS } from "../src/kids/words";

describe("kids words", () => {
  it("are hiragana words on the board, each picture and word once", () => {
    expect(KIDS_WORDS.length).toBeGreaterThanOrEqual(80);
    expect(new Set(KIDS_WORDS.map((word) => word.emoji)).size).toBe(
      KIDS_WORDS.length,
    );
    expect(new Set(KIDS_WORDS.map((word) => word.reading)).size).toBe(
      KIDS_WORDS.length,
    );
    for (const word of KIDS_WORDS) {
      expect(word.reading).toMatch(/^[ぁ-ゖー]+$/);
      const letters = Array.from(normalizeKana(word.reading));
      expect(letters.length).toBe(Array.from(word.reading).length);
      expect(letters.every((letter) => GOJUON_SET.has(letter))).toBe(true);
    }
  });
});

describe("kids play", () => {
  const apple = { emoji: "🍎", reading: "りんご" };

  it("clears once every letter is open, in any order", () => {
    let play = startKids(apple);
    expect(play.needed).toEqual(["り", "ん", "こ"]);
    play = openKids(play, "こ");
    play = openKids(play, "り");
    expect(play.cleared).toBe(false);
    expect(kidsSlots(play).map((slot) => slot.shown)).toEqual([
      true,
      false,
      true,
    ]);
    play = openKids(play, "ん");
    expect(play.cleared).toBe(true);
    expect(openKids(play, "あ")).toBe(play);
  });

  it("opens a letter once for a word that repeats it", () => {
    let play = startKids({ emoji: "🍑", reading: "もも" });
    play = openKids(play, "も");
    expect(play.cleared).toBe(true);
  });

  it("lights the next letter after a few misses and resets on a hit", () => {
    let play = startKids(apple);
    for (const char of ["あ", "い", "う"].slice(0, HINT_AFTER_MISSES)) {
      expect(kidsHint(play)).toBeNull();
      play = openKids(play, char);
    }
    expect(kidsHint(play)).toBe("り");
    play = openKids(play, "あ");
    expect(play.misses).toBe(HINT_AFTER_MISSES);
    play = openKids(play, "り");
    expect(play.misses).toBe(0);
    expect(kidsHint(play)).toBeNull();
  });
});

describe("kids board order", () => {
  it("keeps the table in order, or mixes every letter into the same shape", () => {
    expect(kidsGrid(false, Math.random)).toBe(GOJUON_GRID);
    let seed = 1;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const mixed = kidsGrid(true, random);
    expect(mixed.map((row) => row.map((char) => char === null))).toEqual(
      GOJUON_GRID.map((row) => row.map((char) => char === null)),
    );
    const letters = (grid: typeof mixed) =>
      grid.flat().filter((char): char is string => char !== null);
    expect([...letters(mixed)].sort()).toEqual(
      [...letters(GOJUON_GRID)].sort(),
    );
    expect(letters(mixed)).not.toEqual(letters(GOJUON_GRID));
  });
});
