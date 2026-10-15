import { describe, expect, it } from "vitest";

import { QUESTIONS, questionPromptEn } from "../src/data/questions";
import {
  createInitialState,
  openCharacter,
  passAnswer,
  submitAnswer,
} from "../src/game/engine";
import { getBoardOrder } from "../src/game/board";
import { concedeGame, toPublicState } from "../src/online/rules";

const question = QUESTIONS.find((item) => item.language === "ja")!;

describe("engine messages in both languages", () => {
  it("writes an English message next to every Japanese one", () => {
    let state = createInitialState(question);
    const seen = [state];
    state = submitAnswer(state, "まちがい");
    seen.push(state);
    for (const char of getBoardOrder(question.language)) {
      if (state.phase === "finished") break;
      if (state.phase === "answer") state = passAnswer(state);
      else state = openCharacter(state, char);
      seen.push(state);
    }
    for (const step of seen) {
      expect(step.lastMessage).toMatch(/[ぁ-んァ-ン一-龥]/);
      expect(step.lastMessageEn.length).toBeGreaterThan(0);
      // Only the quoted board letters may be kana.
      const words = step.lastMessageEn.replace(/"[^"]*"/g, "");
      expect(words).not.toMatch(/[ぁ-ゖァ-ヺ一-龥]/u);
    }
  });

  it("sends both to online players, including conceded games", () => {
    const state = concedeGame(createInitialState(question), 0, "timeout");
    const shown = toPublicState(state);
    expect(shown.lastMessage).toContain("持ち時間");
    expect(shown.lastMessageEn).toBe(
      "Player 1 ran out of time. Player 2 wins!",
    );
    expect(shown.promptEn).toBe(questionPromptEn(question));
  });
});
