import { describe, expect, it } from "vitest";

import {
  buildCustomQuestion,
  checkCustom,
  type CustomInput,
} from "../src/custom/question";
import {
  adjacentMineCount,
  isAcceptedAnswer,
  isMineCharacter,
} from "../src/game/engine";
import { guessSolo, openSoloCell, startSolo } from "../src/game/solo";

const ja = (reading: string, display = "", hint = ""): CustomInput => ({
  language: "ja",
  reading,
  display,
  hint,
});

describe("custom question", () => {
  it("takes a reading in hiragana or katakana, small kana and dakuten", () => {
    expect(checkCustom(ja("らーめん"))).toBeNull();
    expect(checkCustom(ja("ジャズ"))).toBeNull();
    expect(checkCustom(ja("がっこう"))).toBeNull();
  });

  it("refuses kanji, an empty reading, and words too short or long", () => {
    expect(checkCustom(ja("学校"))).toBe("notKana");
    expect(checkCustom(ja("  "))).toBe("empty");
    expect(checkCustom(ja("あ"))).toBe("tooShort");
    expect(checkCustom(ja("あいうえおかきくけこさしす"))).toBe("tooLong");
    expect(
      checkCustom({ language: "en", reading: "cat5", display: "", hint: "" }),
    ).toBe("notLetters");
  });

  it("plays like a bank question: mines, numbers and answers", () => {
    const question = buildCustomQuestion(ja("がっこう", "学校", "場所"))!;
    expect(question.length).toBe(4);
    expect(question.category).toBe("場所");
    expect(isMineCharacter(question, "か")).toBe(true);
    expect(isMineCharacter(question, "つ")).toBe(true);
    expect(isMineCharacter(question, "あ")).toBe(false);
    expect(adjacentMineCount(question, "き")).toBe(2);
    expect(isAcceptedAnswer(question, "学校")).toBe(true);
    expect(isAcceptedAnswer(question, "ガッコウ")).toBe(true);
    expect(isAcceptedAnswer(question, "がっこ")).toBe(false);
  });

  it("uses the reading as the shown word when none is given", () => {
    const question = buildCustomQuestion({
      language: "en",
      reading: "Ice cream",
      display: "",
      hint: "",
    })!;
    expect(question.answers[0]!.display).toBe("Ice cream");
    expect(question.length).toBe(8);
    expect(isAcceptedAnswer(question, "icecream")).toBe(true);
  });

  it("counts the guesser's moves", () => {
    const question = buildCustomQuestion(ja("さくら"))!;
    let play = startSolo(question);
    play = openSoloCell(play, "わ");
    play = guessSolo(play, "さくらんぼ");
    expect(play.moves).toBe(2);
    play = guessSolo(play, "サクラ");
    expect(play.status).toBe("solved");
  });
});
