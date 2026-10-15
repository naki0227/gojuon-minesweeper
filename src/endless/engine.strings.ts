import { tr } from "../i18n";

// Messages for src/endless/engine.ts (Endless is client-only, so it can use
// the device language directly).
export const ENDLESS_MESSAGES = tr({
  ja: {
    start: "答えを予想するか、回答をパスしてマスを開こう。",
    wrong: "不正解。",
    allShown: (lead: string) =>
      `${lead}答えはすべて表示中。入力して次へ進もう。`,
    letterShown: (lead: string, index: number, penalty: number) =>
      `${lead}答えの${index}文字目を表示（-${penalty}点）。`,
    difficultyBonus: (bonus: number) => `（難易度ボーナス +${bonus}）`,
    easyPenalty: (bonus: number) => `（易しめ ${bonus}）`,
    correct: (earned: number, note: string) =>
      `正解！ +${earned}点${note}。次の問題に進もう。`,
    wrongOpen: "不正解。1文字開けてヒントを探そう。",
    pass: "安全だと思うマスを1つ開けよう。",
    outOfLives: "ライフがなくなった！ 復活するか記録を確定しよう。",
    mine: "地雷！ ライフが1つ減った。",
    exhausted: (penalty: number) =>
      `安全なマスはすべて開いた！ ここからは回答を外すかパスするたびに、答えの文字が1つずつ出る（1文字-${penalty}点）。`,
    chain: (bonus: number, cells: number) =>
      `CHAIN +${bonus}点！ 周囲の${cells}マスも開いた。`,
    safe: "安全！ 数字を手掛かりに次の答えを考えよう。",
    hint: (char: string) => `「${char}」は安全。開くと数字が確認できるよ。`,
    revived: "復活！ ライフ2つと安全マスのヒントを獲得。",
    next: "次の問題！ 少ない手数・被弾で正解を目指そう。",
    gameOver: "ゲームオーバー！",
  },
  en: {
    start: "Guess the answer, or pass and open a cell.",
    wrong: "Wrong. ",
    allShown: (lead: string) =>
      `${lead}The whole answer is showing. Type it to move on.`,
    letterShown: (lead: string, index: number, penalty: number) =>
      `${lead}Letter ${index} of the answer is shown (-${penalty} pts).`,
    difficultyBonus: (bonus: number) => ` (difficulty bonus +${bonus})`,
    easyPenalty: (bonus: number) => ` (easy question ${bonus})`,
    correct: (earned: number, note: string) =>
      `Correct! +${earned} pts${note}. On to the next question.`,
    wrongOpen: "Wrong. Open a letter to look for clues.",
    pass: "Open a cell you think is safe.",
    outOfLives: "Out of lives! Revive, or lock in your score.",
    mine: "Mine! You lost a life.",
    exhausted: (penalty: number) =>
      `All safe cells are open! From now on, each wrong answer or pass shows one more letter of the answer (-${penalty} pts per letter).`,
    chain: (bonus: number, cells: number) =>
      `CHAIN +${bonus} pts! ${cells} nearby ${cells === 1 ? "cell" : "cells"} opened too.`,
    safe: "Safe! Use the numbers to work out the answer.",
    hint: (char: string) => `"${char}" is safe. Open it to see its number.`,
    revived: "Revived! You got 2 lives and a safe-cell hint.",
    next: "Next question! Solve it with as few moves and mines as you can.",
    gameOver: "Game over!",
  },
});
