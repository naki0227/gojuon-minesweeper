import type { Question } from "../data/types";
import { QUESTIONS, primaryAnswer } from "../data/questions";
import { cellView, samePromptPool } from "../daily/puzzle";
import { seededRandom } from "../daily/random";
import { getBoardOrder } from "../game/board";
import { answerCharacters, type GameState } from "../game/engine";

// The computer opponent of the one-player match. It plays by the same
// public information as a person: the prompt, the open cells and the
// revealed answer letters. It keeps a list of the words it "knows" with
// that prompt and narrows it down cell by cell.
export type BotLevel = "easy" | "normal" | "hard";

type LevelRules = {
  // Share of the prompt's words the bot knows (the answer may not be one).
  knows: number;
  // Answers when this many candidates or fewer are left...
  guessAt: number;
  // ...with this chance when more than one is left.
  guessChance: number;
  // Picks the most telling cell (true) or a random low-risk one.
  smart: boolean;
};

const LEVELS: Record<BotLevel, LevelRules> = {
  easy: { knows: 0.45, guessAt: 3, guessChance: 0.35, smart: false },
  normal: { knows: 0.8, guessAt: 2, guessChance: 0.5, smart: true },
  hard: { knows: 1, guessAt: 1, guessChance: 0, smart: true },
};

export type Bot = {
  level: BotLevel;
  vocabulary: readonly Question[];
  random: () => number;
};

export type BotMove =
  | { kind: "answer"; text: string; candidates: number }
  | { kind: "pass"; candidates: number }
  | { kind: "open"; char: string; candidates: number };

export function createBot(
  level: BotLevel,
  question: Question,
  seed: string,
  bank: readonly Question[] = QUESTIONS,
): Bot {
  const random = seededRandom(`${seed}:${level}`);
  const pool = samePromptPool(question, bank);
  const { knows } = LEVELS[level];
  const vocabulary = knows >= 1 ? pool : pool.filter(() => random() < knows);
  return { level, vocabulary, random };
}

// The words the bot knows that fit everything on the board.
export function botCandidates(bot: Bot, state: GameState): Question[] {
  const target = state.question;
  const views = state.openedChars.map((char) => cellView(target, char));
  const prefix = answerCharacters(target).slice(0, state.revealedAnswerChars);
  return bot.vocabulary.filter(
    (word) =>
      state.openedChars.every((char, i) => cellView(word, char) === views[i]) &&
      prefix.every((char, i) => answerCharacters(word)[i] === char),
  );
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

// How many words would still fit after opening `char`, on average, and
// the chance that `char` is a mine (which costs the bot its next answer).
function scoreCell(char: string, candidates: readonly Question[]) {
  const groups = new Map<string, number>();
  let mines = 0;
  for (const word of candidates) {
    const view = cellView(word, char);
    groups.set(view, (groups.get(view) ?? 0) + 1);
    if (view.startsWith("m")) mines += 1;
  }
  let expected = 0;
  for (const size of groups.values())
    expected += (size * size) / candidates.length;
  return { expected, mineChance: mines / candidates.length };
}

function chooseCell(
  bot: Bot,
  state: GameState,
  candidates: readonly Question[],
): string {
  const closed = getBoardOrder(state.question.language).filter(
    (char) => !state.openedChars.includes(char),
  );
  if (candidates.length === 0) return pick(closed, bot.random);

  const scored = closed.map((char) => ({
    char,
    ...scoreCell(char, candidates),
  }));
  if (!LEVELS[bot.level].smart) {
    const safeish = scored.filter((cell) => cell.mineChance < 0.5);
    return pick(safeish.length > 0 ? safeish : scored, bot.random).char;
  }
  // A mine blocks the next answer, which is worth about a third of the
  // words still in play; ties go to a random cell so games differ.
  const cost = (cell: (typeof scored)[number]) =>
    cell.expected + cell.mineChance * candidates.length * 0.35;
  const best = Math.min(...scored.map(cost));
  return pick(
    scored.filter((cell) => cost(cell) - best < 1e-9),
    bot.random,
  ).char;
}

export function botMove(bot: Bot, state: GameState): BotMove | null {
  if (state.phase === "finished" || state.winner !== null) return null;
  const candidates = botCandidates(bot, state);
  const count = candidates.length;

  if (state.phase === "open") {
    return {
      kind: "open",
      char: chooseCell(bot, state, candidates),
      candidates: count,
    };
  }

  const rules = LEVELS[bot.level];
  const sure = count === 1;
  const willGuess =
    count > 0 &&
    count <= rules.guessAt &&
    (sure || bot.random() < rules.guessChance);
  if (willGuess) {
    const word = pick(candidates, bot.random);
    return {
      kind: "answer",
      text: primaryAnswer(word).display,
      candidates: count,
    };
  }
  return { kind: "pass", candidates: count };
}
