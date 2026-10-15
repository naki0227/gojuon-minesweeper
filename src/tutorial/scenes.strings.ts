import { tr } from "../i18n";

export const SCENE_TEXT = tr({
  ja: {
    // A 3x3 piece of the board, and the answer typed in the first scene.
    board: ["か", "き", "く", "さ", "し", "す", "た", "ち", "つ"],
    typed: "うさぎ",
    prompt: "3文字の動物",
    answer: "回答する",
    win: "正解なら勝ち！",
    promptSmall: "5文字の動物",
    change: "条件を変える",
    rules: "ルール",
    openCaption: { pre: "「し」の周りに答えの文字が ", em: "2", post: " 個" },
    chainCaption: {
      pre: "",
      em: "0",
      post: " なら周りの安全なマスが一気に開く",
    },
    mineCaption: {
      pre: "答えの文字は",
      em: "地雷",
      post: "。次の自分の番は回答できない",
    },
  },
  en: {
    board: ["B", "C", "D", "H", "I", "J", "N", "O", "P"],
    typed: "CAT",
    prompt: "3-letter word · Animals",
    answer: "Guess",
    win: "Right answer wins!",
    promptSmall: "5-letter word · Animals",
    change: "Change settings",
    rules: "Rules",
    openCaption: { pre: "", em: "2", post: " answer letters around “I”" },
    chainCaption: {
      pre: "",
      em: "0",
      post: " opens all the safe cells around it",
    },
    mineCaption: {
      pre: "Answer letters are ",
      em: "mines",
      post: ". No guess on your next turn",
    },
  },
});
