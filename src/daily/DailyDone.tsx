// After 今日の一問: the answer, the streak, sharing, the morning reminder
// and the プレゼント (entry and results for this device's tickets).
import { useEffect, useState } from "react";
import { Linking, Share, Switch, Text, View } from "react-native";

import { Pressable } from "../components/TapPressable";
import { primaryAnswer } from "../data/questions";
import { styles } from "../endless/styles";
import {
  enterGift,
  giftAvailable,
  giftResults,
  newDeviceId,
  type GiftResult,
} from "./gift";
import { dailyShareText, movesLine, type DailyPlay } from "./play";
import { remindersSupported, setMorningReminder } from "./reminder";
import { dailyUrl, GIFT_RULES_URL, shortDate } from "./schedule";
import type { DailyMemory } from "./storage";
import { currentStreak } from "./streak";

type Props = {
  play: DailyPlay;
  trivia?: string;
  // Entries close when the answer is published (yesterday's puzzle).
  canEnter: boolean;
  memory: DailyMemory;
  onMemory: (memory: DailyMemory) => void;
};

const STATUS: Record<GiftResult["status"], string> = {
  pending: "抽選は明日の朝7時",
  won: "当選！🎉",
  lost: "今回はハズレ…",
  expired: "受け取り期限が過ぎました",
};

export function DailyDone({ play, trivia, canEnter, memory, onMemory }: Props) {
  const streak = currentStreak(memory.streak, play.date);
  const [results, setResults] = useState<GiftResult[]>([]);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const entered = memory.tickets.some((t) => t.date === play.date);

  useEffect(() => {
    if (!giftAvailable || memory.tickets.length === 0) return;
    void giftResults(memory.tickets.map((t) => t.ticket)).then((res) => {
      if (res.ok) setResults(res.results);
    });
  }, [memory.tickets]);

  async function enter() {
    setEntering(true);
    const device = memory.device ?? newDeviceId();
    // Only a solved game gets here, so the answer is known to be right.
    const answer = primaryAnswer(play.question).value;
    const res = await enterGift(play.date, answer, device);
    setEntering(false);
    if (!res.ok) return setGiftError(res.error);
    if (!res.correct) return setGiftError("応募できませんでした。");
    onMemory({
      ...memory,
      device,
      tickets: [
        { ticket: res.ticket, date: res.date },
        ...memory.tickets.filter((t) => t.ticket !== res.ticket),
      ].slice(0, 30),
    });
  }

  async function toggleReminder(on: boolean) {
    const result = await setMorningReminder(on);
    onMemory({ ...memory, reminder: result });
  }

  return (
    <>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>
          {play.phase === "solved" ? "正解！🎉" : "答えは…"}
        </Text>
        <Text style={styles.answer}>
          {primaryAnswer(play.question).display}
        </Text>
        {trivia ? <Text style={styles.panelText}>{trivia}</Text> : null}
        <Text style={styles.panelText}>
          {movesLine(play.moves)}
          {streak > 0 ? `　🔥${streak}日連続` : ""}
        </Text>
        <Pressable
          style={styles.primary}
          onPress={() =>
            void Share.share({
              message: dailyShareText(play, streak, dailyUrl(play.date)),
            })
          }
        >
          <Text style={styles.primaryText}>結果をシェア</Text>
        </Pressable>
      </View>

      {remindersSupported ? (
        <View style={[styles.panel, styles.top]}>
          <Text style={[styles.panelText, { flex: 1 }]}>
            毎朝7時に新しい問題をお知らせ
          </Text>
          <Switch
            value={memory.reminder}
            onValueChange={(on) => void toggleReminder(on)}
          />
        </View>
      ) : null}

      {giftAvailable ? (
        <View style={styles.panel}>
          <Text style={styles.noticeTitle}>🎁 今日の一問 プレゼント</Text>
          {play.phase === "solved" && canEnter && !entered ? (
            <>
              <Text style={styles.panelText}>
                正解した人の中から毎日抽選でジェム10個のコードが当たります（リリース記念で最初の100名はその場でプレゼント）。
              </Text>
              <Pressable
                style={[styles.secondary, entering && styles.disabled]}
                disabled={entering}
                onPress={() => void enter()}
              >
                <Text style={styles.secondaryText}>応募する</Text>
              </Pressable>
            </>
          ) : null}
          {results.map((r) => (
            <View key={r.ticket} style={{ gap: 6 }}>
              <Text style={styles.panelText}>
                {shortDate(r.date)}の問題（受け取り番号 {r.ticket}）：
                {STATUS[r.status]}
              </Text>
              {r.url ? (
                <Pressable
                  style={styles.primary}
                  onPress={() => void Linking.openURL(r.url!)}
                >
                  <Text style={styles.primaryText}>App Storeで受け取る</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {giftError ? <Text style={styles.error}>{giftError}</Text> : null}
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(GIFT_RULES_URL)}
          >
            <Text style={[styles.micro, styles.link]}>
              プレゼントのルールを見る
            </Text>
          </Pressable>
          <Text style={styles.micro}>
            このプレゼントは五十音マインスイーパーの開発者が行うもので、Appleが提供・協賛するものではありません。
          </Text>
        </View>
      ) : null}
    </>
  );
}
