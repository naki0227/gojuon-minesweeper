// The three 今日の一問 videos as HTML pages: today's question (vertical),
// yesterday's answer (vertical) and a week of puzzles (horizontal).
import { questionPrompt } from "../../../src/data/questions";
import {
  dailyAnswer,
  dailyQuestion,
  shortDate,
  type DailyEntry,
} from "../../../src/daily/schedule";
import { colors } from "../../../src/theme/colors";
import { WEEKDAYS } from "../card";
import { escapeHtml } from "../html";
import {
  answerTimeline,
  type QuestionTimeline,
  type WeekTimeline,
} from "./timeline";
import { isHalloween } from "../season";
import { answerTiles, at, boardHtml, logoHtml, pageHtml } from "./scene";

export const HANDLE = "@gojuonmine";

function dayLabel(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return `${shortDate(date)}（${WEEKDAYS[day]}）`;
}

function prompt(entry: DailyEntry): string {
  return escapeHtml(questionPrompt(dailyQuestion(entry)));
}

// Long prompts (「6文字の遊び・おもちゃ」) wrap at full size, so they get a
// smaller line.
function promptClass(entry: DailyEntry): string {
  return Array.from(questionPrompt(dailyQuestion(entry))).length > 9
    ? "prompt long"
    : "prompt";
}

// Shorts and Reels cover the bottom and the right edge with buttons, so the
// vertical layouts keep their content in the middle.
const VERTICAL_CSS = `
main{position:absolute;inset:150px 70px 380px 70px;display:flex;flex-direction:column;justify-content:center;gap:44px}
.head{display:flex;align-items:center;justify-content:space-between}
.badge{font-size:40px;font-weight:900;color:${colors.primary};letter-spacing:2px}
.badge span{color:${colors.ink};margin-left:14px}
.prompt{font-size:100px;font-weight:900;line-height:1.1}
.prompt.long{font-size:80px}
.prompt em{display:block;font-style:normal;font-size:72px;color:${colors.accentStrong}}
.legend{font-size:30px;color:#3e4c56;font-weight:700;line-height:1.6}
.legend b{color:${colors.accent}}
.cta{background:${colors.ink};color:#fff;border-radius:28px;padding:34px 40px;display:flex;flex-direction:column;gap:10px;transform-origin:center}
.cta strong{font-size:64px;font-weight:900}
.cta span{font-size:34px;font-weight:700;color:#d6e6f0}
.cta.mini{padding:22px 32px;gap:6px;border-radius:22px}
.cta.mini strong{font-size:44px}
.cta.mini span{font-size:30px}
main.tight{gap:36px}
.cta em{font-style:normal;font-size:36px;font-weight:900;color:#ffd166}
.lead{font-size:52px;font-weight:900;color:${colors.primary}}
.foot{position:absolute;left:70px;right:70px;bottom:300px;display:flex;justify-content:space-between;font-size:30px;color:#627481;font-weight:800}`;

function footer(): string {
  return `<div class="foot"><span>${HANDLE}</span><span>minesweeper.enludus.com</span></div>`;
}

export function questionVideoHtml(
  entry: DailyEntry,
  timeline: QuestionTimeline,
): string {
  const openAt = new Map(timeline.opens.map((open) => [open.char, open.at]));
  return pageHtml(
    1080,
    1920,
    1,
    VERTICAL_CSS,
    `<main>
<div class="head">${logoHtml()}<div class="badge">今日の一問<span>${dayLabel(entry.date)}</span></div></div>
<div class="${promptClass(entry)}">${prompt(entry)}<em>わかる？🤔</em></div>
${boardHtml(entry, (char) => openAt.get(char) ?? null)}
<div class="legend"${at(0.5, { fx: "fade" })}>数字＝周りにある答えの文字の数<br><b>オレンジ</b>＝答えに入っている文字</div>
<div class="cta"${at(timeline.ctaAt)}><strong>答えは？🤔</strong><span>コメントで教えてね／正解は明日7時に公開</span><em${at(timeline.followAt, { fx: "fade" })}>🔔 チャンネル登録で毎朝7時にお届け</em></div>
</main>${footer()}`,
    entry.date,
  );
}

function answerReveal(entry: DailyEntry, start: number, width: number) {
  const timeline = answerTimeline(entry, start);
  const revealAt = new Map(timeline.reveals.map((r) => [r.char, r.at]));
  const board = boardHtml(entry, (char) =>
    entry.opened.includes(char) ? 0 : (revealAt.get(char) ?? null),
  );
  const answer = `<div${at(timeline.answerAt)}>${answerTiles(dailyAnswer(entry), width)}</div>`;
  const trivia = entry.trivia
    ? `<p class="trivia"${at(timeline.answerAt + 0.8, { fx: "fade" })}>${escapeHtml(entry.trivia)}</p>`
    : "";
  return { timeline, board, answer, trivia };
}

export function answerVideoHtml(entry: DailyEntry): string {
  const { timeline, board, answer, trivia } = answerReveal(entry, 0, 940);
  return pageHtml(
    1080,
    1920,
    1,
    VERTICAL_CSS,
    `<main class="tight">
<div class="head">${logoHtml()}<div class="badge">答え合わせ<span>${dayLabel(entry.date)}</span></div></div>
<div class="${promptClass(entry)}">${prompt(entry)}</div>
${board}
<div class="lead"${at(1, { fx: "fade", until: timeline.answerAt })}>答えは……</div>
${answer}${trivia}
<div class="cta mini"${at(timeline.followAt)}><strong>明日の一問もお楽しみに</strong><span>🔔 チャンネル登録で毎朝7時にお届け</span></div>
</main>${footer()}`,
    entry.date,
  );
}

const WEEK_CSS = `
.slide{position:absolute;inset:0;padding:70px 90px;display:flex;gap:70px;align-items:center}
.slide .board{width:860px;flex:none}
.side{flex:1;display:flex;flex-direction:column;gap:30px}
.no{font-size:36px;font-weight:900;color:${colors.primary};letter-spacing:2px}
.no span{color:${colors.ink};margin-left:12px}
.prompt{font-size:76px;font-weight:900;line-height:1.15}
.think{font-size:40px;font-weight:900;color:#3e4c56}
.lead{font-size:44px;font-weight:900;color:${colors.primary}}
.trivia{font-size:28px}
.center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center}
.big{font-size:96px;font-weight:900;line-height:1.15}
.sub{font-size:44px;font-weight:800;color:#3e4c56}
.links{font-size:36px;font-weight:800;color:${colors.primary};line-height:1.7}`;

export function weekVideoHtml(timeline: WeekTimeline): string {
  const first = timeline.segments[0]!.entry.date;
  const last = timeline.segments.at(-1)!.entry.date;
  const slides = timeline.segments.map((segment, i) => {
    const { entry, start, thinkAt, thinkEnd, end } = segment;
    const { board, answer, trivia } = answerReveal(
      entry,
      segment.answerStart,
      760,
    );
    const answerAt = segment.answer.answerAt;
    return `<div class="slide"${at(start, { until: end, fx: "fade" })}>${board}<div class="side">
<div class="no">第${i + 1}問<span>${dayLabel(entry.date)}</span></div>
<div class="prompt">${prompt(entry)}</div>
<div class="think"${at(thinkAt, { fx: "fade", until: thinkEnd })}>考えてみよう</div>
<div class="bar"${at(thinkAt, { fx: "bar", dur: thinkEnd - thinkAt, until: thinkEnd })}></div>
<div class="lead"${at(thinkEnd, { fx: "fade", until: answerAt })}>答えは……</div>
${answer}${trivia}</div></div>`;
  });
  return pageHtml(
    1920,
    1080,
    0.86,
    WEEK_CSS,
    `<div class="center"${at(0, { until: timeline.introEnd, fx: "fade" })}>${logoHtml()}
<div class="big">今日の一問<br>1週間まとめ</div><div class="sub">${shortDate(first)}〜${shortDate(last)}　全${timeline.segments.length}問、何問わかる？</div></div>
${slides.join("\n")}
<div class="center"${at(timeline.outroAt, { fx: "fade" })}>${logoHtml()}
<div class="big">毎朝7時に新しい一問</div>
<div class="links">iPhoneアプリ（無料）・ブラウザで遊べる<br>minesweeper.enludus.com　${HANDLE}</div></div>`,
    first,
  );
}

// The roundup's YouTube thumbnail (1280x720): the first puzzle's board as
// it starts, with the title. Rendered as one frame of the page.
export function weekThumbnailHtml(entries: readonly DailyEntry[]): string {
  const first = entries[0]!;
  const opened = new Set(first.opened);
  const board = boardHtml(first, (char) => (opened.has(char) ? 0 : null));
  return pageHtml(
    1280,
    720,
    0.62,
    `.thumb{position:absolute;inset:0;padding:44px 56px;display:flex;gap:44px;align-items:center}
.thumb .board{width:560px;flex:none}
.copy{flex:1;display:flex;flex-direction:column;gap:22px}
.kicker{font-size:34px;font-weight:900;color:${colors.primary}}
.title{font-size:84px;font-weight:900;line-height:1.08}
.q{font-size:52px;font-weight:900;color:${colors.accentStrong}}
.range{font-size:30px;font-weight:800;color:#3e4c56}`,
    `<div class="thumb">${board}<div class="copy">${logoHtml()}
<div class="kicker">${isHalloween(first.date) ? "🎃 ハロウィン週の一問" : "今日の一問"}</div>
<div class="title">1週間<br>まとめ</div>
<div class="q">全${entries.length}問、<br>何問わかる？</div>
<div class="range">${shortDate(first.date)}〜${shortDate(entries.at(-1)!.date)}</div></div></div>`,
    first.date,
  );
}
