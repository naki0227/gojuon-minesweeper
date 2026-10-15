// The local match's messages, in Japanese and English. The online server
// runs the same engine and sends both (see GameState.lastMessageEn).
export type Said = { ja: string; en: string };

type Player = 0 | 1;

function name(player: Player): string {
  return `Player ${player + 1}`;
}

export function say(text: Said): {
  lastMessage: string;
  lastMessageEn: string;
} {
  return { lastMessage: text.ja, lastMessageEn: text.en };
}

export function joined(first: Said, second: Said): Said {
  return { ja: `${first.ja} ${second.ja}`, en: `${first.en} ${second.en}` };
}

const DRAW: Said = {
  ja: "答えの全文字が開いたため引き分けです。",
  en: "Every letter of the answer is open, so it's a draw.",
};

export const MSG = {
  start: {
    ja: "Player 1 からスタート。まず答えを予想してください。",
    en: "Player 1 goes first. Start by guessing the answer.",
  },
  draw: DRAW,
  toAnswer: (player: Player): Said => ({
    ja: `${name(player)} の回答です。`,
    en: `${name(player)} to answer.`,
  }),
  nextLetter: (player: Player): Said => ({
    ja: `答えの次の1文字が開きました。${name(player)} の回答です。`,
    en: `The next letter of the answer is open. ${name(player)} to answer.`,
  }),
  correct: (player: Player): Said => ({
    ja: `${name(player)} 正解！`,
    en: `${name(player)} got it!`,
  }),
  wrong: { ja: "不正解。", en: "Wrong." },
  wrongOpen: {
    ja: "不正解。盤面から1文字開けてください。",
    en: "Wrong. Open one letter on the board.",
  },
  passed: { ja: "回答をパスしました。", en: "Passed." },
  passedOpen: {
    ja: "回答をパスしました。盤面から1文字開けてください。",
    en: "Passed. Open one letter on the board.",
  },
  alreadyOpen: {
    ja: "その文字はすでに開いています。",
    en: "That letter is already open.",
  },
  mine: (char: string, times: number, player: Player): Said => ({
    ja: `「${char}」は地雷${times > 1 ? `（答えに${times}回）` : ""}！ ${name(player)} は次回の回答権なし。`,
    en: `"${char}" is a mine${times > 1 ? ` (${times} times in the answer)` : ""}! ${name(player)} skips the next answer.`,
  }),
  chain: (char: string, cells: number): Said => ({
    ja: `「${char}」の周囲に答えの文字なし。周辺${cells}マスも開きました。`,
    en: `No answer letters around "${char}". ${cells} more cells opened.`,
  }),
  safe: (char: string, count: number): Said => ({
    ja: `「${char}」はセーフ。周囲の答え文字は${count}個。`,
    en: `"${char}" is safe. ${count} answer ${count === 1 ? "letter" : "letters"} around it.`,
  }),
  firstLetter: (player: Player): Said => ({
    ja: `安全なマスがすべて開き、答えの先頭1文字を表示しました。${name(player)} の回答です。`,
    en: `All safe cells are open, so the first letter of the answer is shown. ${name(player)} to answer.`,
  }),
  blocked: (player: Player): Said => ({
    ja: `${name(player)} は回答なしで1文字開けてください。`,
    en: `${name(player)} can't answer this turn. Open one letter.`,
  }),
  turn: (player: Player): Said => ({
    ja: `${name(player)} のターンです。`,
    en: `${name(player)}'s turn.`,
  }),
  // The next player's turn, or an open-only turn after they hit a mine.
  nextTurn: (player: Player, blocked: boolean): Said =>
    blocked ? MSG.blocked(player) : MSG.turn(player),
};
