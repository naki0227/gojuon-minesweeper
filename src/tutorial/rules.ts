import { tr } from "../i18n";

type Step = { readonly title: string; readonly body: string };

// The rules, written once: the tutorial shows one step per page and the
// web build lists the same text under the board.
export const RULE_STEPS: readonly Step[] = tr({
  ja: [
    {
      title: "答えを予想して回答",
      body: "お題の言葉を予想して入力。当たれば勝ち。自信がなければ回答せずに進めます。",
    },
    {
      title: "1文字開いてヒント",
      body: "回答のあとに1マス開きます。数字は周り8マスにある答えの文字の数（重複込み）。",
    },
    {
      title: "0なら連鎖",
      body: "周りに答えの文字がなければ、安全なマスがまとめて開きます。",
    },
    {
      title: "地雷に注意",
      body: "答えに含まれる文字を開くと地雷。次の自分の番は回答できません。",
    },
  ],
  en: [
    {
      title: "Guess the word",
      body: "Type your guess for the hidden word. Get it right and you win. Not sure? You can skip guessing.",
    },
    {
      title: "Open a cell for a hint",
      body: "After guessing, open one cell. Its number counts the answer's letters in the 8 cells around it (repeats included).",
    },
    {
      title: "0 opens a chain",
      body: "If none of the answer's letters are nearby, the safe cells around it open all at once.",
    },
    {
      title: "Watch out for mines",
      body: "Opening a letter that's in the answer sets off a mine. You can't guess on your next turn.",
    },
  ],
});

export const HELP_STEP: Step = tr({
  ja: {
    title: "ルールはいつでも",
    body: "対戦中も「ルール」を押すと、この説明をもう一度見られます。",
  },
  en: {
    title: "Rules anytime",
    body: "Tap “Rules” during a game to see this guide again.",
  },
});
