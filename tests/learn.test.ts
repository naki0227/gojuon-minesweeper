import { describe, expect, it } from "vitest";

import { isAcceptedAnswer } from "../src/game/engine";
import { GOJUON_ORDER } from "../src/game/gojuon";
import { normalizedLength } from "../src/game/normalize";
import { cellRomaji, romajiSpellings, toRomaji } from "../src/learn/romaji";
import { LEARN_WORDS, learnQuestion } from "../src/learn/words";

describe("romaji", () => {
  it("writes Hepburn, with digraphs, small つ and the long mark", () => {
    expect(toRomaji("ねこ")).toBe("neko");
    expect(toRomaji("しゃしん")).toBe("shashin");
    expect(toRomaji("きょう")).toBe("kyou");
    expect(toRomaji("でんしゃ")).toBe("densha");
    expect(toRomaji("じてんしゃ")).toBe("jitensha");
    expect(toRomaji("がっこう")).toBe("gakkou");
    expect(toRomaji("きっぷ")).toBe("kippu");
    expect(toRomaji("ラーメン")).toBe("raamen");
    expect(toRomaji("コーヒー")).toBe("koohii");
    expect(toRomaji("おちゃ")).toBe("ocha");
  });

  it("also accepts long vowels written short", () => {
    expect(romajiSpellings("がっこう")).toEqual(["gakkou", "gakko"]);
    expect(romajiSpellings("ラーメン")).toEqual(["raamen", "ramen"]);
    expect(romajiSpellings("ねこ")).toEqual(["neko"]);
  });

  it("gives every board cell a caption", () => {
    for (const char of GOJUON_ORDER) expect(cellRomaji(char)).not.toBe("");
  });
});

describe("learn words", () => {
  it("are distinct readings of 2 to 6 board letters", () => {
    const readings = new Set(LEARN_WORDS.map((w) => w.reading));
    expect(readings.size).toBe(LEARN_WORDS.length);
    for (const word of LEARN_WORDS) {
      const length = normalizedLength(word.reading, "ja");
      expect(length).toBeGreaterThanOrEqual(2);
      expect(length).toBeLessThanOrEqual(6);
      expect(word.meaning).not.toBe("");
    }
  });

  it("take the answer in kana, kanji or romaji", () => {
    const school = learnQuestion(
      LEARN_WORDS.find((w) => w.reading === "がっこう")!,
    );
    expect(isAcceptedAnswer(school, "がっこう")).toBe(true);
    expect(isAcceptedAnswer(school, "学校")).toBe(true);
    expect(isAcceptedAnswer(school, "Gakkou")).toBe(true);
    expect(isAcceptedAnswer(school, "gakko")).toBe(true);
    expect(isAcceptedAnswer(school, "gakusei")).toBe(false);
    expect(school.category).toBe("school");
  });
});
