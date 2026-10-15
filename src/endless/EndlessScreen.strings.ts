import { tr } from "../i18n";
import type { EndlessState } from "./engine";

// Text for EndlessScreen.tsx, kept apart so the screen stays under its line
// limit.
export const ENDLESS_SCREEN_TEXT = tr({
  ja: {
    noQuestions: "出題できる問題がありません。",
    adNotWatched: "広告を視聴できませんでした。時間をおいて試してください。",
    adFailed: "広告の読み込みに失敗しました。もう一度お試しください。",
    reviveFailed: "復活できませんでした。",
    hintFailed: "ヒントを取得できませんでした。",
    shareLines: (game: EndlessState) => [
      "五十音マインスイーパー ENDLESS",
      `${game.score}点 / ${game.solved}問正解`,
      `開いた数 ${game.totalOpenedMoves}・地雷 ${game.totalMineHits}・復活 ${game.revives}回`,
      "#五十音マインスイーパー",
    ],
    shareFailed: "Xの投稿画面を開けませんでした。",
    pageTitle: "エンドレスモード | 五十音マインスイーパー",
    pageDescription:
      "ライフ3つで言葉を解き続けるソロモード。少ない手数で高得点を目指そう。",
    chain: (bonus: number) => `CHAIN +${bonus}点`,
    noMatch: "この条件では問題が見つかりませんでした。",
    changeFilters: "条件を選び直す",
  },
  en: {
    noQuestions: "No more questions to play.",
    adNotWatched: "Couldn't play the ad. Please try again later.",
    adFailed: "The ad failed to load. Please try again.",
    reviveFailed: "Couldn't revive.",
    hintFailed: "Couldn't get a hint.",
    shareLines: (game: EndlessState) => [
      "Gojuon Minesweeper ENDLESS",
      `${game.score} pts / ${game.solved} solved`,
      `${game.totalOpenedMoves} opens · ${game.totalMineHits} mines · ${game.revives} revives`,
      "#GojuonMinesweeper",
    ],
    shareFailed: "Couldn't open X to post.",
    pageTitle: "Endless | Gojuon Minesweeper",
    pageDescription:
      "A solo mode where you keep solving words with 3 lives. Go for a high score in as few moves as you can.",
    chain: (bonus: number) => `CHAIN +${bonus} pts`,
    noMatch: "No questions match these settings.",
    changeFilters: "Change settings",
  },
});
