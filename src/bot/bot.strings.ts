import { tr } from "../i18n";
import type { BotLevel } from "./brain";

const BOT_LEVEL_JA: Record<BotLevel, string> = {
  easy: "よわい",
  normal: "ふつう",
  hard: "つよい",
};
const BOT_LEVEL_EN: Record<BotLevel, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
};

// Text for the match against the bot (src/bot/BotScreen.tsx).
export const BOT_TEXT = tr({
  ja: {
    title: "ひとりで（ボットと対戦）",
    lead: "ボットも同じ盤面だけを見て推理します。強さを選んでね。",
    level: BOT_LEVEL_JA,
    levelNote: {
      easy: "知っている言葉が少なめ。あてずっぽうもします",
      normal: "よく知っていて、効くマスを狙います",
      hard: "全部の言葉を知っていて、確信したときだけ答えます",
    } as Record<BotLevel, string>,
    back: "もどる",
    you: "あなた",
    bot: (level: BotLevel) => `ボット（${BOT_LEVEL_JA[level]}）`,
    thinking: "ボットが考えています…",
    thought: (count: number) =>
      count === 0
        ? "ボット：知っている言葉では、当てはまるものがない…"
        : count === 1
          ? "ボット：答えがわかった気がする"
          : `ボット：当てはまりそうな言葉は、あと${count}個`,
    youWin: "あなたの勝ち！",
    botWins: "ボットの勝ち…",
    draw: "引き分け！",
    noQuestion: "この条件の問題がありません。条件を変えてください。",
  },
  en: {
    title: "Solo (vs the bot)",
    lead: "The bot sees only the same board as you. Pick its strength.",
    level: BOT_LEVEL_EN,
    levelNote: {
      easy: "Knows fewer words and sometimes guesses",
      normal: "Knows most words and opens telling cells",
      hard: "Knows every word and answers only when sure",
    } as Record<BotLevel, string>,
    back: "Back",
    you: "You",
    bot: (level: BotLevel) => `Bot (${BOT_LEVEL_EN[level]})`,
    thinking: "The bot is thinking…",
    thought: (count: number) =>
      count === 0
        ? "Bot: none of the words I know fit…"
        : count === 1
          ? "Bot: I think I've got it"
          : `Bot: ${count} words could still fit`,
    youWin: "You win!",
    botWins: "The bot wins…",
    draw: "It's a draw!",
    noQuestion: "No questions match. Change the settings.",
  },
});
