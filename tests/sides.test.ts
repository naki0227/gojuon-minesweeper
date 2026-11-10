import { describe, expect, it } from "vitest";

import { nameSides } from "../src/i18n/sides";

const BOT = ["You", "Bot (Hard)"] as const;

describe("nameSides", () => {
  it("fixes English verbs for You", () => {
    expect(
      nameSides("Player 1 goes first. Start by guessing the answer.", BOT),
    ).toBe("You go first. Start by guessing the answer.");
    expect(nameSides("Player 1's turn.", BOT)).toBe("Your turn.");
    expect(nameSides("Player 1 to answer.", BOT)).toBe("Your turn to answer.");
    expect(
      nameSides('"E" is a mine! Player 1 skips the next answer.', BOT),
    ).toBe('"E" is a mine! You skip the next answer.');
  });

  it("leaves third-person labels as they are", () => {
    expect(nameSides("Player 2's turn.", BOT)).toBe("Bot (Hard)'s turn.");
    expect(nameSides("Player 2 skips the next answer.", BOT)).toBe(
      "Bot (Hard) skips the next answer.",
    );
    expect(nameSides("Player 1 goes first.", ["Player 1", "Player 2"])).toBe(
      "Player 1 goes first.",
    );
  });

  it("does not touch Japanese labels", () => {
    expect(nameSides("Player 1 からスタート。", ["あなた", "ボット"])).toBe(
      "あなた からスタート。",
    );
  });
});
