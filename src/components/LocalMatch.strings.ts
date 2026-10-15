import type { QuestionLanguage } from "../data/types";
import { tr } from "../i18n";

// Text for the two-player match on the home screen (app/index.tsx).
export const LOCAL_MATCH_TEXT = tr({
  ja: {
    placeholder: (language: QuestionLanguage) =>
      language === "ja" ? "漢字・ひらがな・カタカナで回答" : "英単語を入力",
    cannotAnswer: "このターンは回答できません",
    changeSettings: "条件を変える",
    turn: "手番",
    phaseFinished: "決着",
    phaseAnswer: "回答",
    phaseOpen: "1文字開く",
    answerHint: (hint: string) => `答えの文字：${hint}`,
    draw: "引き分け！",
    win: (player: number) => `Player ${player} の勝ち！`,
    answer: (answers: string) => `答え：${answers}`,
    sameLetters: "同じ文字構成のため、どれも正解として扱います。",
    rematch: "同じ条件でもう一戦",
    answerLabel: "回答",
    submit: "回答する",
    pass: "回答しない",
  },
  en: {
    placeholder: (language: QuestionLanguage) =>
      language === "ja" ? "Answer in kana or kanji" : "Type the English word",
    cannotAnswer: "You can't answer this turn",
    changeSettings: "Change settings",
    turn: "Turn",
    phaseFinished: "Game over",
    phaseAnswer: "Answer",
    phaseOpen: "Open a cell",
    answerHint: (hint: string) => `Answer letters: ${hint}`,
    draw: "It's a draw!",
    win: (player: number) => `Player ${player} wins!`,
    answer: (answers: string) => `Answer: ${answers}`,
    sameLetters:
      "These use the same letters, so any of them counts as correct.",
    rematch: "Rematch, same settings",
    answerLabel: "Answer",
    submit: "Submit",
    pass: "Pass",
  },
});
