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
import { escapeHtml } from "./html";
import { LOTTERY_CSS, lotterySection, rulesList } from "./lottery";
import {
  answerPostText,
  questionPostText,
  videoPaths,
  videoUrl,
  weekPostText,
  type VideoPlan,
} from "./video/texts";

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
video{width:100%;border-radius:14px;background:#000}
h2{margin:12px 0 0;font-size:20px}
.thumbs{display:flex;gap:8px}.thumbs a{flex:1;font-size:12px;text-align:center;text-decoration:none}${LOTTERY_CSS}
</style></head><body><main>${body}</main></body></html>`;
}

function promptOf(entry: DailyEntry): string {
  return questionPrompt(dailyQuestion(entry));
}

function imageUrl(entry: DailyEntry, size = "square"): string {
  return `${SITE_URL}/daily/${entry.date}/${size}.png`;
}

// The day's page: the image, then the answer once the day is over. With
// `lotteryEndpoint`, the プレゼント box (entries on today's page only).
export function dayPage(
  entry: DailyEntry,
  revealed: boolean,
  lotteryEndpoint?: string,
): string {
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
<img src="${imageUrl(entry)}" alt="${prompt}の盤面">${answer}${
      lotteryEndpoint ? lotterySection(entry, !revealed, lotteryEndpoint) : ""
    }
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

// /daily/rules/: the プレゼント rules on their own, linked from the app.
export function rulesPage(): string {
  return layout(
    `<title>今日の一問 プレゼントのルール | 五十音マインスイーパー</title>
<meta name="description" content="今日の一問に正解すると応募できるプレゼントのルール。">`,
    `<div class="eyebrow">今日の一問</div><h1>プレゼントのルール</h1>
<div class="card gift">${rulesList()}</div>
<a class="row" href="${SITE_URL}/daily/">今日の一問へ</a>`,
  );
}

function copyBlock(id: string, text: string, label: string): string {
  return `<pre id="${id}">${escapeHtml(text)}</pre><button onclick="navigator.clipboard.writeText(document.getElementById('${id}').textContent).then(()=>{this.textContent='コピーしました'})">${label}</button>`;
}

function thumbnailBlock(url: string): string {
  return `<img src="${url}" alt="サムネイル"><a class="cta" href="${url}" download>サムネイルを保存</a>`;
}

function videoBlock(title: string, path: string, note: string): string {
  const url = videoUrl(path);
  return `<h2>${title}</h2><p>${note}</p>
<video src="${url}" controls playsinline preload="metadata"></video>
<a class="cta" href="${url}" download>動画を保存</a>`;
}

// Today's question, yesterday's answer and last week's roundup.
function videoSection(videos: VideoPlan): string {
  const parts: string[] = [];
  if (videos.question) {
    parts.push(
      videoBlock(
        "問題ショート",
        videoPaths.question(videos.question),
        "TikTok・リール・YouTubeショート用。1行目がタイトルになるよ。",
      ),
      copyBlock(
        "question-post",
        questionPostText(videos.question),
        "本文をコピー",
      ),
    );
  }
  if (videos.answer) {
    parts.push(
      videoBlock(
        `答え合わせショート（${shortDate(videos.answer.date)}の問題）`,
        videoPaths.answer(videos.answer),
        "前日の問題の答え。7時以降に投稿してね。",
      ),
      copyBlock("answer-post", answerPostText(videos.answer), "本文をコピー"),
    );
  }
  if (videos.week.length > 0) {
    const { title, description } = weekPostText(videos.week);
    parts.push(
      videoBlock(
        "1週間まとめ（YouTube横動画）",
        videoPaths.week(videos.week),
        "月〜日の問題をまとめた横動画。月曜の朝に新しくなります。",
      ),
      thumbnailBlock(videoUrl(videoPaths.weekThumbnail(videos.week))),
      copyBlock("week-title", title, "タイトルをコピー"),
      copyBlock("week-description", description, "説明をコピー"),
    );
  }
  return parts.join("");
}

// For posting by hand: today's images and the texts to paste.
export function kitPage(entry: DailyEntry, videos: VideoPlan): string {
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
  return layout(
    `<title>投稿キット | 今日の一問</title><meta name="robots" content="noindex">`,
    `<h1>投稿キット ${shortDate(entry.date)}</h1>
<p>画像を長押しで保存 → 本文をコピーして投稿 → 返信をコピーして自分の投稿にリプ。</p>
<div class="thumbs">${thumbs}</div>${copyBlock("post", post, "本文をコピー")}${copyBlock("reply", reply, "返信をコピー")}
<details><summary>答えを表示</summary><div class="answer">${escapeHtml(dailyAnswer(entry))}</div></details>
${videoSection(videos)}`,
  );
}
