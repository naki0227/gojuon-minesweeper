import type { QuestionLanguage } from "../data/types";
import { tr } from "../i18n";
import type { CustomProblem } from "./question";

// Text for the custom question (src/custom/CustomScreen.tsx).
export const CUSTOM_TEXT = tr({
  ja: {
    title: "出題して遊ぶ",
    lead: "あなたが決めた言葉を、相手が盤面から推理して当てます。入力したらスマホを相手に渡してね。",
    language: { ja: "日本語", en: "English" } as Record<
      QuestionLanguage,
      string
    >,
    reading: (language: QuestionLanguage) =>
      language === "ja" ? "答えの読み（ひらがな・カタカナ）" : "答えの単語",
    display: "表記（漢字など・なくてもOK）",
    hint: "ヒント（例：食べ物・人の名前）",
    problem: {
      empty: "答えを入力してください",
      notKana: "読みはひらがなかカタカナで入力してください",
      notLetters: "英字だけで入力してください",
      tooShort: "2文字以上にしてください",
      tooLong: "12文字までにしてください",
    } as Record<CustomProblem, string>,
    ready: "出題する",
    back: "もどる",
    handoffTitle: "スマホを相手に渡してね",
    handoffLead: (prompt: string) =>
      `お題は「${prompt}」。準備ができたら始めます。`,
    start: "はじめる",
    prompt: (length: number, hint: string) =>
      `${length}文字の${hint || "ことば"}`,
    moves: (moves: number) => `いま${moves}手`,
    solved: (moves: number) => `正解！ ${moves}手で当てました`,
    gaveUp: "答えを見ました",
    answer: (word: string) => `答え：${word}`,
    share: "結果をシェア",
    shareText: (prompt: string, word: string, moves: number) =>
      `五十音マインスイーパーで「${prompt}」の出題を${moves}手で当てた！（答え：${word}）#五十音マインスイーパー`,
    again: "もう一問出題する",
    home: "ホームへ",
  },
  en: {
    title: "Make a question",
    lead: "Pick a word, and your friend works it out from the board. Type it in, then hand them the phone.",
    language: { ja: "日本語", en: "English" } as Record<
      QuestionLanguage,
      string
    >,
    reading: (language: QuestionLanguage) =>
      language === "ja" ? "Reading (hiragana or katakana)" : "The word",
    display: "How it's written (optional)",
    hint: "Hint (e.g. food, a name)",
    problem: {
      empty: "Type the word",
      notKana: "Type the reading in hiragana or katakana",
      notLetters: "Use letters only",
      tooShort: "Use at least 2 letters",
      tooLong: "Use 12 letters at most",
    } as Record<CustomProblem, string>,
    ready: "Ask it",
    back: "Back",
    handoffTitle: "Hand the phone over",
    handoffLead: (prompt: string) =>
      `The question is "${prompt}". Start when ready.`,
    start: "Start",
    prompt: (length: number, hint: string) =>
      `${length} letters${hint ? `: ${hint}` : ""}`,
    moves: (moves: number) => `${moves} moves so far`,
    solved: (moves: number) => `Got it in ${moves} moves!`,
    gaveUp: "Answer shown",
    answer: (word: string) => `Answer: ${word}`,
    share: "Share",
    shareText: (prompt: string, word: string, moves: number) =>
      `I guessed "${prompt}" in ${moves} moves on Gojuon Minesweeper! (It was ${word})`,
    again: "Ask another",
    home: "Home",
  },
});
