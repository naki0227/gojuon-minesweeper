import { LOCALE } from "../i18n";

// The online server (src/online/rules.ts applyMove and the online-game Edge
// Function) and the client explain errors in Japanese. English players see
// these translations, or a generic message for anything unknown.
const ENGLISH_ERRORS: Readonly<Record<string, string>> = {
  // applyMove
  "この対戦は終わっています。": "This game is already over.",
  "相手の手番です。": "It's your opponent's turn.",
  "いまは回答できません。": "You can't answer right now.",
  "回答を入力してください。": "Please type an answer.",
  "いまは文字を開けません。": "You can't open a letter right now.",
  "その文字は盤面にありません。": "That letter isn't on the board.",
  "その文字はすでに開いています。": "That letter is already open.",
  "不明な操作です。": "Unknown action.",
  // Edge Function
  "部屋が見つかりません。": "Room not found.",
  "対戦の準備ができていません。": "The game isn't ready yet.",
  "ほかの操作と重なりました。もう一度どうぞ。":
    "That clashed with another move. Please try again.",
  "合言葉は2〜16文字で入力してください。":
    "Room codes must be 2 to 16 characters.",
  "混み合っています。もう一度どうぞ。": "The server is busy. Please try again.",
  "この部屋の参加者ではありません。": "You're not in this room.",
  "対戦中ではありません。": "No game is in progress.",
  "まだ持ち時間が残っています。": "There's still time left on the clock.",
  "あなたの手番です。": "It's your turn.",
  "この部屋ではもう一戦できません。": "You can't play again in this room.",
  "ログインできませんでした。": "Couldn't sign in.",
  "サーバーでエラーが起きました。": "Something went wrong on the server.",
  // Client
  "オンラインに接続できませんでした。": "Couldn't connect to online play.",
  "通信できませんでした。電波を確認してください。":
    "Couldn't connect. Please check your connection.",
  "通信できませんでした。": "Couldn't connect.",
};

const FALLBACK = "Something went wrong. Please try again.";

// An error message in the UI language.
export function errorText(message: string): string {
  if (LOCALE === "ja") {
    return message;
  }
  return ENGLISH_ERRORS[message] ?? FALLBACK;
}
