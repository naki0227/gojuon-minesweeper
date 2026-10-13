// Static HTML for the 今日の一問 pages. publish.ts writes them only for
// dates that have arrived, so nothing about a future puzzle is online.
import { questionPrompt } from "../../src/data/questions";
import {
  dailyAnswer,
  dailyPostTexts,
  dailyQuestion,
  dailyUrl,
  shortDate,
  type DailyEntry,
} from "../../src/daily/schedule";
import { appStoreUrl, SITE_URL } from "../../src/links/site";
import { colors } from "../../src/theme/colors";

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function layout(head: string, body: string): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${head}
<style>
*{box-sizing:border-box}body{margin:0;background:${colors.background};color:${colors.ink};
font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif}
main{max-width:560px;margin:0 auto;padding:24px 16px 40px;display:flex;flex-direction:column;gap:16px}
.eyebrow{color:${colors.primary};font-weight:900;letter-spacing:2px;font-size:14px}
h1{margin:0;font-size:30px;font-weight:900}
p{margin:0;color:#536875;font-size:15px;line-height:1.7}
img{width:100%;border-radius:14px;display:block}
.card{background:#fff;border:1px solid ${colors.line};border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:8px}
.label{color:${colors.muted};font-size:13px;font-weight:800}
.answer{color:${colors.accent};font-size:32px;font-weight:900}
.cta{display:block;text-align:center;background:${colors.primary};color:#fff;border-radius:10px;padding:13px;font-weight:800;text-decoration:none}
a{color:${colors.link};font-weight:700}
.row{display:block;background:#fff;border:1px solid ${colors.line};border-radius:12px;padding:14px;text-decoration:none;color:${colors.ink};font-weight:800}
.row span{color:${colors.primary};margin-right:10px}
pre{white-space:pre-wrap;background:#fff;border:1px solid ${colors.line};border-radius:10px;padding:12px;font:inherit;font-size:14px;margin:0}
button{border:0;background:${colors.primary};color:#fff;border-radius:10px;padding:13px;font-weight:800;font-size:15px}
.thumbs{display:flex;gap:8px}.thumbs a{flex:1;font-size:12px;text-align:center;text-decoration:none}
</style></head><body><main>${body}</main></body></html>`;
}

function promptOf(entry: DailyEntry): string {
  return questionPrompt(dailyQuestion(entry));
}

function imageUrl(entry: DailyEntry, size = "square"): string {
  return `${SITE_URL}/daily/${entry.date}/${size}.png`;
}

// The day's page: the image, then the answer once the day is over.
export function dayPage(entry: DailyEntry, revealed: boolean): string {
  const prompt = escapeHtml(promptOf(entry));
  const title = `今日の一問 ${shortDate(entry.date)}「${prompt}」`;
  const answer = revealed
    ? `<div class="card"><div class="label">答え</div><div class="answer">${escapeHtml(dailyAnswer(entry))}</div>${
        entry.trivia ? `<p>${escapeHtml(entry.trivia)}</p>` : ""
      }</div>`
    : `<div class="card"><p>開いたマスの数字は、周り8マスにある答えの文字の数。オレンジのマスは答えに入っている文字です。答えは明日の朝7時にこのページで公開します。</p></div>`;
  const head = `<title>${title} | 五十音マインスイーパー</title>
<meta name="description" content="お題「${prompt}」。開いたマスの数字から答えを推理しよう。">
<link rel="canonical" href="${dailyUrl(entry.date)}">
<meta property="og:title" content="${title}"><meta property="og:image" content="${imageUrl(entry)}">
<meta property="og:url" content="${dailyUrl(entry.date)}"><meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${imageUrl(entry)}">`;
  return layout(
    head,
    `<div class="eyebrow">今日の一問 ${shortDate(entry.date)}</div><h1>${prompt}</h1>
<img src="${imageUrl(entry)}" alt="${prompt}の盤面">${answer}
<a class="cta" href="${SITE_URL}/">ブラウザで遊ぶ</a>
<a class="cta" href="${escapeHtml(appStoreUrl("web_daily"))}">iPhoneアプリで遊ぶ</a>
<a href="${SITE_URL}/daily/">ほかの日の問題</a>`,
  );
}

// Released puzzles, newest first.
export function listPage(entries: readonly DailyEntry[]): string {
  const rows = [...entries]
    .reverse()
    .map(
      (entry) =>
        `<a class="row" href="${dailyUrl(entry.date)}"><span>${shortDate(entry.date)}</span>${escapeHtml(promptOf(entry))}</a>`,
    )
    .join("");
  return layout(
    `<title>今日の一問 | 五十音マインスイーパー</title>
<meta name="description" content="毎日1問、盤面の数字から答えを推理する「今日の一問」。">`,
    `<h1>今日の一問</h1><p>毎朝7時に新しい問題。開いたマスの数字から答えを推理しよう。</p>${rows}`,
  );
}

// For posting by hand: today's images and the texts to paste.
export function kitPage(entry: DailyEntry): string {
  const { post, reply } = dailyPostTexts(entry);
  const thumbs = [
    ["square", "X"],
    ["feed", "インスタ"],
    ["story", "TikTok・ストーリー"],
  ]
    .map(
      ([size, label]) =>
        `<a href="${imageUrl(entry, size)}"><img src="${imageUrl(entry, size)}" alt="">${label}</a>`,
    )
    .join("");
  const copy = (id: string, text: string, label: string) =>
    `<pre id="${id}">${escapeHtml(text)}</pre><button onclick="navigator.clipboard.writeText(document.getElementById('${id}').textContent).then(()=>{this.textContent='コピーしました'})">${label}</button>`;
  return layout(
    `<title>投稿キット | 今日の一問</title><meta name="robots" content="noindex">`,
    `<h1>投稿キット ${shortDate(entry.date)}</h1>
<p>画像を長押しで保存 → 本文をコピーして投稿 → 返信をコピーして自分の投稿にリプ。</p>
<div class="thumbs">${thumbs}</div>${copy("post", post, "本文をコピー")}${copy("reply", reply, "返信をコピー")}
<details><summary>答えを表示</summary><div class="answer">${escapeHtml(dailyAnswer(entry))}</div></details>`,
  );
}
