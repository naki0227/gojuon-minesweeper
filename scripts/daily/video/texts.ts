// Where the 今日の一問 videos go and the texts to post with them. Kept
// apart from the renderer so the posting kit page can use them.
import { questionPrompt } from "../../../src/data/questions";
import {
  dailyAnswer,
  dailyQuestion,
  dailyUrl,
  shortDate,
  type DailyEntry,
} from "../../../src/daily/schedule";
import { SITE_URL } from "../../../src/links/site";
import { HANDLE } from "./slides";
import { clock, lastFullWeek, weekTimeline } from "./timeline";

export type VideoPlan = {
  question?: DailyEntry;
  answer?: DailyEntry;
  week: DailyEntry[];
};

export function planVideos(
  released: readonly DailyEntry[],
  today: string,
): VideoPlan {
  const current = released.at(-1);
  return {
    question: current?.date === today ? current : undefined,
    answer: released.filter((entry) => entry.date < today).at(-1),
    week: lastFullWeek(released, today),
  };
}

// Paths under /daily/, the same on disk (outDir) and on the site.
export const videoPaths = {
  question: (entry: DailyEntry) => `${entry.date}/question.mp4`,
  answer: (entry: DailyEntry) => `${entry.date}/answer.mp4`,
  week: (entries: readonly DailyEntry[]) => `week/${entries[0]!.date}.mp4`,
  weekThumbnail: (entries: readonly DailyEntry[]) =>
    `week/${entries[0]!.date}.jpg`,
};

export function videoUrl(path: string): string {
  return `${SITE_URL}/daily/${path}`;
}

function promptOf(entry: DailyEntry): string {
  return questionPrompt(dailyQuestion(entry));
}

export function answerPostText(entry: DailyEntry): string {
  return [
    `【答え合わせ ${shortDate(entry.date)}】お題：${promptOf(entry)}`,
    `正解は「${dailyAnswer(entry)}」でした！ 当たった？`,
    "今日の一問は毎朝7時に出題中🧩",
    "#五十音マインスイーパー #今日の一問",
  ].join("\n");
}

// Title and description for YouTube, with chapters for each puzzle.
export function weekPostText(entries: readonly DailyEntry[]): {
  title: string;
  description: string;
} {
  const timeline = weekTimeline(entries);
  const first = shortDate(entries[0]!.date);
  const last = shortDate(entries.at(-1)!.date);
  const chapters = [
    "0:00 オープニング",
    ...timeline.segments.map(
      (segment, i) =>
        `${clock(segment.start)} 第${i + 1}問 ${shortDate(segment.entry.date)}「${promptOf(segment.entry)}」`,
    ),
    `${clock(timeline.outroAt)} おわりに`,
  ];
  return {
    title: `今日の一問 1週間まとめ（${first}〜${last}）全${entries.length}問、何問わかる？`,
    description: [
      "五十音の盤面で「ことば」を推理する、五十音マインスイーパーの「今日の一問」。",
      "開いたマスの数字は、周りにある答えの文字の数。答えを推理してみてね。",
      "",
      ...chapters,
      "",
      "📱 iPhoneアプリ（無料）",
      `${SITE_URL}/app`,
      "🌐 ブラウザで遊ぶ",
      SITE_URL,
      `🧩 問題のページ ${dailyUrl(entries[0]!.date)}`,
      `X ${HANDLE}`,
      "",
      "#五十音マインスイーパー #今日の一問 #パズル",
    ].join("\n"),
  };
}
