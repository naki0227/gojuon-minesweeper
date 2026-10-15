import { tr } from "../i18n";

export const SCENE_TEXT = tr({
  ja: {
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
    prompt: "3-kana word · Animal",
    answer: "Guess",
    win: "Right answer wins!",
    promptSmall: "5-kana word · Animal",
    change: "Change settings",
    rules: "Rules",
    openCaption: { pre: "", em: "2", post: " answer letters around 「し」" },
    chainCaption: {
      pre: "",
      em: "0",
      post: " opens all the safe tiles around it",
    },
    mineCaption: {
      pre: "Answer letters are ",
      em: "mines",
      post: ". No guess on your next turn",
    },
  },
});
