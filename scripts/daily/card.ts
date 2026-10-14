// The 今日の一問 image as an HTML page, rendered to PNG by render.ts.
// Colors follow src/theme/colors.ts and the board tiles (tileStyles).
import { questionPrompt } from "../../src/data/questions";
import type { Question } from "../../src/data/types";
import { getBoardGrid } from "../../src/game/board";
import {
  adjacentMineCount,
  isMineCharacter,
  questionMineMultiplicity,
} from "../../src/game/engine";
import { colors, COUNT_COLOR_MANY, COUNT_COLORS } from "../../src/theme/colors";
import {
  dailyQuestion,
  shortDate,
  type DailyEntry,
} from "../../src/daily/schedule";
import { escapeHtml } from "./html";

export type CardSize = { name: string; width: number; height: number };

export const CARD_SIZES: readonly CardSize[] = [
  { name: "square", width: 1080, height: 1080 }, // X
  { name: "feed", width: 1080, height: 1350 }, // Instagram feed (4:5)
  { name: "story", width: 1080, height: 1920 }, // TikTok, Reels, Stories
];

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// One board cell. Shared with the 今日の一問 videos (video/scene.ts).
export function tileHtml(
  question: Question,
  char: string | null,
  open: boolean,
  attrs = "",
): string {
  if (char === null) return `<div class="t gap"${attrs}></div>`;
  if (!open) return `<div class="t closed"${attrs}>${char}</div>`;
  if (isMineCharacter(question, char)) {
    const times = questionMineMultiplicity(question, char);
    return `<div class="t mine"${attrs}>${char}${times > 1 ? `<i>×${times}</i>` : ""}</div>`;
  }
  const count = adjacentMineCount(question, char);
  const color = COUNT_COLORS[count] ?? COUNT_COLOR_MANY;
  return `<div class="t safe"${attrs}><small>${char}</small>${
    count ? `<b style="color:${color}">${count}</b>` : ""
  }</div>`;
}

// Tile styles; `unit` scales the sizes used on the 1080px-wide card.
export function tileCss(unit = 1): string {
  const px = (value: number) => `${Math.round(value * unit)}px`;
  return `.t{aspect-ratio:1;min-width:0;overflow:hidden;border-radius:${px(16)};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${px(44)};position:relative}
.gap{visibility:hidden}
.closed{background:#fff;border:${px(2)} solid #c9d5df;border-bottom:${px(6)} solid #bccbd6;color:#152534}
.safe{background:#e6edf2;border:${px(2)} solid #d8e0e6}
.safe small{position:absolute;top:${px(4)};left:${px(9)};font-size:${px(24)};color:#8696a1;font-weight:800}
.safe b{font-size:${px(54)};margin-top:${px(12)}}
.mine{background:${colors.accent};border:${px(2)} solid ${colors.accentStrong};border-bottom:${px(6)} solid ${colors.accentStrong};color:#fff}
.mine i{position:absolute;right:${px(6)};bottom:${px(2)};font-size:${px(20)};font-style:normal}`;
}

export function cardHtml(entry: DailyEntry, size: CardSize): string {
  const question = dailyQuestion(entry);
  const day = new Date(`${entry.date}T00:00:00Z`).getUTCDay();
  const tall = size.height / size.width;
  const board = getBoardGrid(question.language)
    .map((row) =>
      row
        .map((char) =>
          tileHtml(question, char, !!char && entry.opened.includes(char)),
        )
        .join(""),
    )
    .join("");
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:${size.width}px;height:${size.height}px;background:linear-gradient(170deg,${colors.primarySoft},${colors.background} 45%);
font-family:"Hiragino Sans","Noto Sans CJK JP","Noto Sans JP",sans-serif;color:${colors.ink};
display:flex;flex-direction:column;justify-content:center;gap:${tall > 1.5 ? 56 : 34}px;padding:64px 60px}
.head{display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;gap:6px}.logo div{width:58px;height:58px;background:${colors.ink};color:#fff;font-weight:900;font-size:34px;display:flex;align-items:center;justify-content:center}
.logo div:last-child{background:${colors.primary}}
.badge{font-size:34px;font-weight:900;color:${colors.primary};letter-spacing:2px}
.badge span{color:${colors.ink};margin-left:14px}
.prompt{font-size:${tall > 1.5 ? 104 : 88}px;font-weight:900;line-height:1.1}
.board{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:9px}
${tileCss()}
.legend{display:flex;gap:28px;font-size:28px;color:#3e4c56;font-weight:700;flex-wrap:wrap}
.legend span{display:inline-flex;align-items:center;gap:10px}
.sw{width:34px;height:34px;border-radius:8px;display:inline-block}
.cta{font-size:${tall > 1.5 ? 50 : 42}px;font-weight:900;color:${colors.ink};border-left:10px solid ${colors.accent};padding-left:22px}
.foot{display:flex;justify-content:space-between;font-size:26px;color:#627481;font-weight:700}
</style></head><body>
<div class="head"><div class="logo"><div>五</div><div>十</div><div>音</div></div>
<div class="badge">今日の一問<span>${shortDate(entry.date)}（${WEEKDAYS[day]}）</span></div></div>
<div class="prompt">${escapeHtml(questionPrompt(question))}</div>
<div class="board">${board}</div>
<div class="legend"><span><i class="sw" style="background:#e6edf2;border:2px solid #d8e0e6"></i>数字＝周り8マスにある答えの文字の数</span>
<span><i class="sw" style="background:${colors.accent}"></i>答えに入っている文字</span></div>
<div class="cta">答えを推理して、コメントしてね！</div>
<div class="foot"><span>#五十音マインスイーパー</span><span>minesweeper.enludus.com</span></div>
</body></html>`;
}
