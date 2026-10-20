// Shared pieces of the 今日の一問 video pages. A page holds every element
// of the whole video; `data-at` / `data-until` say when each one is on
// screen, and window.renderAt(t) (below) shows the frame at t seconds.
import { getBoardGrid } from "../../../src/game/board";
import { dailyQuestion, type DailyEntry } from "../../../src/daily/schedule";
import { colors } from "../../../src/theme/colors";
import { tileCss, tileHtml } from "../card";
import { seasonCss, seasonDecor } from "../season";

// fx: "pop" scales in, "fade" fades up, "bar" shrinks over data-dur seconds.
// Progress is quantized so frames that look alike return the same
// signature and are written to disk once.
const RUNTIME = `
const easeOutBack = (p) => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
window.renderAt = (t) => {
  let signature = "";
  for (const el of document.querySelectorAll("[data-at]")) {
    const at = Number(el.dataset.at);
    const until = el.dataset.until ? Number(el.dataset.until) : Infinity;
    // Elements come in document order, so a parent is decided first; a
    // hidden parent hides its children even if they set "visible".
    const parentHidden = el.parentElement.closest("[data-off]") !== null;
    if (parentHidden || t < at || t >= until) {
      el.style.visibility = "hidden";
      el.dataset.off = "";
      signature += "-";
      continue;
    }
    delete el.dataset.off;
    el.style.visibility = "visible";
    const fx = el.dataset.fx || "pop";
    const span = fx === "bar" ? Number(el.dataset.dur) : fx === "fade" ? 0.4 : 0.25;
    const steps = fx === "bar" ? 25 : 10;
    const p = Math.round(Math.min(1, (t - at) / span) * steps) / steps;
    if (fx === "pop") {
      el.style.transform = "scale(" + (p >= 1 ? 1 : easeOutBack(p)) + ")";
      el.style.opacity = String(Math.min(1, p * 2));
    } else if (fx === "fade") {
      el.style.opacity = String(p);
      el.style.transform = "translateY(" + (1 - p) * 24 + "px)";
    } else {
      el.style.width = (1 - p) * 100 + "%";
    }
    signature += p;
  }
  return signature;
};`;

export function at(
  start: number,
  options: { until?: number; fx?: "pop" | "fade" | "bar"; dur?: number } = {},
): string {
  return [
    ` data-at="${start}"`,
    options.until === undefined ? "" : ` data-until="${options.until}"`,
    options.fx ? ` data-fx="${options.fx}"` : "",
    options.dur === undefined ? "" : ` data-dur="${options.dur}"`,
  ].join("");
}

// The board. `openAt(char)` is when a cell opens (0 = from the start,
// null = stays closed); opened cells pop over the closed ones.
export function boardHtml(
  entry: DailyEntry,
  openAt: (char: string) => number | null,
): string {
  const question = dailyQuestion(entry);
  return `<div class="board">${getBoardGrid(question.language)
    .flat()
    .map((char) => {
      if (char === null) return tileHtml(question, null, false);
      const time = openAt(char);
      const closed = tileHtml(question, char, false);
      if (time === null) return `<div class="cell">${closed}</div>`;
      const open = tileHtml(question, char, true, at(time));
      return `<div class="cell">${time > 0 ? closed : ""}${open}</div>`;
    })
    .join("")}</div>`;
}

export function logoHtml(): string {
  return `<div class="logo"><div>五</div><div>十</div><div>音</div></div>`;
}

export function pageHtml(
  width: number,
  height: number,
  unit: number,
  css: string,
  body: string,
  // The puzzle date, for the seasonal look (season.ts).
  date = "",
): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:${width}px;height:${height}px;overflow:hidden;position:relative;
background:linear-gradient(170deg,${colors.primarySoft},${colors.background} 45%);
font-family:"Hiragino Sans","Noto Sans CJK JP","Noto Sans JP",sans-serif;color:${colors.ink}}
[data-at]{visibility:hidden}
.logo{display:flex;gap:${6 * unit}px}
.logo div{width:${58 * unit}px;height:${58 * unit}px;background:${colors.ink};color:#fff;font-weight:900;font-size:${34 * unit}px;display:flex;align-items:center;justify-content:center}
.logo div:last-child{background:${colors.primary}}
.board{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:${9 * unit}px}
.cell{position:relative;aspect-ratio:1}
.cell .t{position:absolute;inset:0}
${tileCss(unit)}
.answer{display:inline-flex;gap:${12 * unit}px}
.answer span{width:${120 * unit}px;height:${120 * unit}px;border-radius:${20 * unit}px;background:${colors.accent};color:#fff;font-weight:900;font-size:${72 * unit}px;display:flex;align-items:center;justify-content:center;border-bottom:${8 * unit}px solid ${colors.accentStrong}}
.trivia{font-size:${32 * unit}px;line-height:1.6;color:#3e4c56;font-weight:700}
.bar{height:${14 * unit}px;border-radius:99px;background:${colors.primary}}
${css}${seasonCss(date)}
</style></head><body>${seasonDecor(date, width / 1080, height / width)}${body}<script>${RUNTIME}</script></body></html>`;
}

// The answer as orange tiles, shrinking so long answers fit `width`.
export function answerTiles(displayed: string, width: number): string {
  const chars = [...displayed];
  const size = Math.min(
    120 * (width / 960),
    Math.floor(width / chars.length) - 12,
  );
  return `<div class="answer">${chars
    .map(
      (char) =>
        `<span style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.6)}px">${char}</span>`,
    )
    .join("")}</div>`;
}
