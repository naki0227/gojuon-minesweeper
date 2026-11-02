/// <reference types="node" />
// Makes the 詰め五十音 pack: src/puzzles/pack-ja.json.
//   npx tsx scripts/puzzles/build.ts
// Each puzzle is a board where 4 to 40 words of the prompt still fit, and
// its par: the fewest cells that settle the answer
// whatever they show (src/puzzles/solver.ts). The same run gives the same
// pack. The answers are in the app anyway; nothing here is secret.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { QUESTIONS } from "../../src/data/questions";
import { isSpecialistCategory } from "../../src/data/specialistCategories";
import {
  consistentCandidates,
  samePromptPool,
  shuffled,
} from "../../src/daily/puzzle";
import { seededRandom } from "../../src/daily/random";
import { getBoardOrder } from "../../src/game/board";
import { expandZeroArea, isMineCharacter } from "../../src/game/engine";
import { bestFirstCells, createSolver, par } from "../../src/puzzles/solver";
import type { PuzzleEntry } from "../../src/puzzles/pack";

// Easy ones first: par 2, then 3, then 4.
const PLAN = [...Array(10).fill(2), ...Array(12).fill(3), ...Array(8).fill(4)];
const PER_CATEGORY = 2;
// Zero cells open their neighbours, so even one open cell often leaves a
// single word; boards start with no cell or one, and 4 to 40 words.
const MIN_WORDS = 4;
const MAX_WORDS = 40;

const random = seededRandom("tsume:ja:1");
const eligible = shuffled(
  QUESTIONS.filter(
    (q) =>
      q.language === "ja" &&
      q.length >= 4 &&
      q.length <= 6 &&
      !isSpecialistCategory(q.category),
  ),
  random,
);

// A blank board, or one safe cell open (with its zero chain), where 4 to
// 40 words fit.
function makeBoard(question: (typeof QUESTIONS)[number]) {
  const pool = samePromptPool(question, QUESTIONS);
  const safe = shuffled(
    getBoardOrder("ja").filter((c) => !isMineCharacter(question, c)),
    random,
  );
  const tries: string[][] = [
    [],
    ...safe.slice(0, 4).map((c) => expandZeroArea(question, c, [])),
  ];
  for (const opened of shuffled(tries, random)) {
    const fit = consistentCandidates(question, pool, opened);
    if (fit.length >= MIN_WORDS && fit.length <= MAX_WORDS)
      return { opened, fit };
  }
  return null;
}

const pack: PuzzleEntry[] = [];
const perCategory = new Map<string, number>();
for (const question of eligible) {
  if (pack.length === PLAN.length) break;
  if ((perCategory.get(question.category) ?? 0) >= PER_CATEGORY) continue;
  const board = makeBoard(question);
  if (!board) continue;
  const solver = createSolver(board.fit, board.opened);
  const solved = par(solver);
  if (solved !== PLAN[pack.length]) continue;
  pack.push({
    id: `t${String(pack.length + 1).padStart(3, "0")}`,
    questionId: question.id,
    opened: board.opened,
    par: solved,
    words: board.fit.length,
    firstCells: bestFirstCells(solver).map((cell) => cell.char),
  });
  perCategory.set(
    question.category,
    (perCategory.get(question.category) ?? 0) + 1,
  );
  console.log(
    pack.length,
    `par ${solved}`,
    `${board.fit.length} words`,
    `${board.opened.length} open`,
  );
}
if (pack.length < PLAN.length) {
  throw new Error(`Only ${pack.length} of ${PLAN.length} puzzles found`);
}

writeFileSync(
  join(process.cwd(), "src/puzzles/pack-ja.json"),
  `[\n${pack.map((entry) => `  ${JSON.stringify(entry)}`).join(",\n")}\n]\n`,
);
