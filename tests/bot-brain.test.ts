import { describe, expect, it } from "vitest";

import { botCandidates, botMove, createBot, type Bot } from "../src/bot/brain";
import { QUESTIONS } from "../src/data/questions";
import { seededRandom } from "../src/daily/random";
import {
  createInitialState,
  openCharacter,
  passAnswer,
  submitAnswer,
  type GameState,
} from "../src/game/engine";

function step(bot: Bot, state: GameState): GameState {
  const move = botMove(bot, state);
  if (!move) return state;
  if (move.kind === "answer") return submitAnswer(state, move.text);
  if (move.kind === "pass") return passAnswer(state);
  return openCharacter(state, move.char);
}

// Two bots play a whole game; returns the final state and the move count.
function play(question: (typeof QUESTIONS)[number], bots: [Bot, Bot]) {
  let state = createInitialState(question);
  let moves = 0;
  while (state.phase !== "finished" && moves < 400) {
    state = step(bots[state.currentPlayer], state);
    moves += 1;
  }
  return { state, moves };
}

function sample(count: number, seed: string) {
  const random = seededRandom(seed);
  return Array.from(
    { length: count },
    () => QUESTIONS[Math.floor(random() * QUESTIONS.length)]!,
  );
}

describe("bot opponent", () => {
  it("knows every word of the prompt on hard, including the answer", () => {
    const question = QUESTIONS.find((q) => q.language === "ja")!;
    const bot = createBot("hard", question, "t");
    const state = createInitialState(question);
    expect(botCandidates(bot, state).some((q) => q.id === question.id)).toBe(
      true,
    );
  });

  it("only keeps words that fit the open cells", () => {
    const question = QUESTIONS.find(
      (q) => q.language === "ja" && q.length >= 4,
    )!;
    const bot = createBot("hard", question, "t");
    let state = passAnswer(createInitialState(question));
    const before = botCandidates(bot, state).length;
    const move = botMove(bot, state)!;
    expect(move.kind).toBe("open");
    if (move.kind !== "open") return;
    state = openCharacter(state, move.char);
    const after = botCandidates(bot, state);
    expect(after.length).toBeLessThanOrEqual(before);
    expect(after.some((q) => q.id === question.id)).toBe(true);
  });

  it("finishes every game, and the hard bot never answers wrong", () => {
    for (const [i, question] of sample(40, "games").entries()) {
      const hard: [Bot, Bot] = [
        createBot("hard", question, `a${i}`),
        createBot("hard", question, `b${i}`),
      ];
      let state = createInitialState(question);
      let moves = 0;
      while (state.phase !== "finished" && moves < 400) {
        const move = botMove(hard[state.currentPlayer], state);
        if (move?.kind === "answer") {
          expect(submitAnswer(state, move.text).winner).toBe(
            state.currentPlayer,
          );
        }
        state = step(hard[state.currentPlayer], state);
        moves += 1;
      }
      expect(state.phase).toBe("finished");
    }
  });

  it("is beaten by the hard bot more often than not on easy", () => {
    let hardWins = 0;
    let easyWins = 0;
    for (const [i, question] of sample(60, "levels").entries()) {
      // Each level plays first in half the games.
      const hardFirst = i % 2 === 0;
      const hard = createBot("hard", question, `h${i}`);
      const easy = createBot("easy", question, `e${i}`);
      const { state } = play(question, hardFirst ? [hard, easy] : [easy, hard]);
      if (state.winner === null) continue;
      const hardWon = (state.winner === 0) === hardFirst;
      if (hardWon) hardWins += 1;
      else easyWins += 1;
    }
    expect(hardWins).toBeGreaterThan(easyWins);
  });

  it("decides a move quickly on a wide prompt", () => {
    const sizes = new Map<string, number>();
    for (const q of QUESTIONS) {
      const key = `${q.language}:${q.category}:${q.length}`;
      sizes.set(key, (sizes.get(key) ?? 0) + 1);
    }
    const [widest] = [...sizes.entries()].sort((a, b) => b[1] - a[1])[0]!;
    const question = QUESTIONS.find(
      (q) => `${q.language}:${q.category}:${q.length}` === widest,
    )!;
    const bot = createBot("hard", question, "speed");
    const state = passAnswer(createInitialState(question));
    const started = performance.now();
    botMove(bot, state);
    expect(performance.now() - started).toBeLessThan(250);
  });
});
