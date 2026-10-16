import { describe, expect, it } from "vitest";

import { primaryAnswer } from "../src/data/questions";
import {
  dailyShareText,
  giveUpDaily,
  guessDaily,
  movesLine,
  openDaily,
  startDaily,
} from "../src/daily/play";
import { DAILY_SCHEDULE, dailyQuestion } from "../src/daily/schedule";
import { currentStreak, NO_STREAK, recordSolve } from "../src/daily/streak";
import { getBoardOrder } from "../src/game/board";
import { isMineCharacter } from "../src/game/engine";

const entry = DAILY_SCHEDULE[0]!;
const question = dailyQuestion(entry);
const answer = primaryAnswer(question);

function fresh() {
  return startDaily(entry.date, question, entry.opened);
}

describe("今日の一問 in the app", () => {
  it("starts from the image's board and resumes a saved game", () => {
    expect(fresh().opened).toEqual(entry.opened);
    const saved = {
      date: entry.date,
      opened: ["あ"],
      moves: [],
      phase: "playing" as const,
    };
    expect(
      startDaily(entry.date, question, entry.opened, saved).opened,
    ).toEqual(["あ"]);
    const old = { ...saved, date: "2000-01-01" };
    expect(startDaily(entry.date, question, entry.opened, old).opened).toEqual(
      entry.opened,
    );
  });

  it("records safe cells, mines, wrong guesses and the solve", () => {
    const board = getBoardOrder(question.language);
    const closed = board.filter((char) => !entry.opened.includes(char));
    const mine = closed.find((char) => isMineCharacter(question, char))!;
    const safe = closed.find((char) => !isMineCharacter(question, char))!;
    let play = openDaily(fresh(), safe);
    play = openDaily(play, mine);
    play = guessDaily(play, "まちがい");
    expect(play.phase).toBe("playing");
    play = guessDaily(play, answer.display);
    expect(play.phase).toBe("solved");
    expect(movesLine(play.moves)).toBe("🟦🟧❌✅");
    // Nothing changes after the end.
    expect(openDaily(play, closed.at(-1)!)).toBe(play);
  });

  it("shares the moves and streak without the answer", () => {
    const solved = guessDaily(fresh(), answer.display);
    const text = dailyShareText(solved, 3, "https://example.com/");
    expect(text).toContain("正解！");
    expect(text).toContain("🔥3日連続");
    expect(text).not.toContain(answer.display);
    expect(dailyShareText(giveUpDaily(fresh()), 0, "u")).toContain(
      "ギブアップ",
    );
  });
});

describe("streak", () => {
  it("counts consecutive solved days and breaks after a missed day", () => {
    let streak = recordSolve(NO_STREAK, "2026-10-14");
    streak = recordSolve(streak, "2026-10-15");
    streak = recordSolve(streak, "2026-10-15");
    expect(streak.count).toBe(2);
    expect(currentStreak(streak, "2026-10-16")).toBe(2);
    expect(currentStreak(streak, "2026-10-17")).toBe(0);
    streak = recordSolve(streak, "2026-10-18");
    expect(streak).toMatchObject({ count: 1, best: 2 });
  });
});
