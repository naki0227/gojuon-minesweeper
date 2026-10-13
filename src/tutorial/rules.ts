// The rules, written once: the tutorial shows one step per page and the
// web build lists the same text under the board.
export const RULE_STEPS = [
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
] as const;

export const HELP_STEP = {
  title: "ルールはいつでも",
  body: "対戦中も「ルール」を押すと、この説明をもう一度見られます。",
} as const;
