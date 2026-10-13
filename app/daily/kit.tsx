import Head from "expo-router/head";
import { useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buttonStyles } from "../../src/components/buttonStyles";
import { docPageStyles } from "../../src/components/docPageStyles";
import { questionPrompt } from "../../src/data/questions";
import {
  addDays,
  DAILY_SCHEDULE,
  dailyAnswer,
  dailyPostTexts,
  dailyQuestion,
  shortDate,
  type DailyEntry,
} from "../../src/daily/schedule";
import { useJapanToday } from "../../src/daily/useJapanToday";
import { SITE_URL } from "../../src/links/site";
import { colors } from "../../src/theme/colors";

const SIZES = [
  { name: "square", label: "X（正方形）" },
  { name: "feed", label: "インスタ（4:5）" },
  { name: "story", label: "TikTok・ストーリー（縦）" },
] as const;

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// For posting 今日の一問 by hand: each day's images to save and the texts
// to paste. Not linked from anywhere and not indexed.
export default function DailyKitScreen() {
  const today = useJapanToday();
  const entries = today
    ? DAILY_SCHEDULE.filter(
        (entry) =>
          entry.date >= addDays(today, -1) && entry.date <= addDays(today, 7),
      )
    : [];
  return (
    <SafeAreaView style={styles.safeArea}>
      <Head>
        <title>投稿キット | 今日の一問</title>
        <meta name="robots" content="noindex" />
      </Head>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.title}>投稿キット</Text>
        <Text style={styles.body}>
          画像を長押しで保存 → 本文をコピーして投稿 →
          返信をコピーして自分の投稿にリプ。
        </Text>
        {entries.map((entry) => (
          <KitDay
            key={entry.date}
            entry={entry}
            isToday={entry.date === today}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function KitDay({ entry, isToday }: { entry: DailyEntry; isToday: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const texts = dailyPostTexts(entry);
  const copyButton = (key: string, label: string, text: string) => (
    <Pressable
      key={key}
      onPress={async () => setCopied((await copy(text)) ? key : null)}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.pressedButton,
      ]}
    >
      <Text style={styles.primaryButtonText}>
        {copied === key ? "コピーしました" : label}
      </Text>
    </Pressable>
  );
  return (
    <View style={[styles.day, isToday && styles.today]}>
      <Text style={styles.heading}>
        {isToday ? "今日 " : ""}
        {shortDate(entry.date)}　{questionPrompt(dailyQuestion(entry))}
      </Text>
      <View style={styles.images}>
        {SIZES.map((size) => {
          const uri = `${SITE_URL}/daily/${entry.date}/${size.name}.png`;
          return (
            <Pressable
              key={size.name}
              onPress={() => void Linking.openURL(uri)}
              style={styles.thumb}
            >
              <Image source={{ uri }} style={styles.thumbImage} />
              <Text style={styles.thumbLabel}>{size.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.text}>{texts.post}</Text>
      {copyButton("post", "本文をコピー", texts.post)}
      <Text style={styles.text}>{texts.reply}</Text>
      {copyButton("reply", "返信をコピー", texts.reply)}
      <Pressable onPress={() => setShowAnswer(!showAnswer)}>
        <Text style={styles.answerToggle}>
          {showAnswer ? `答え：${dailyAnswer(entry)}` : "答えを表示"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = {
  ...docPageStyles,
  ...buttonStyles,
  ...StyleSheet.create({
    day: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      padding: 16,
      gap: 10,
    },
    today: { borderColor: colors.primary, borderWidth: 2 },
    images: { flexDirection: "row", gap: 8 },
    thumb: { flex: 1, gap: 4 },
    thumbImage: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
    },
    thumbLabel: { color: colors.muted, fontSize: 11, textAlign: "center" },
    text: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 20,
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
    },
    answerToggle: {
      color: colors.primary,
      fontWeight: "800",
      textAlign: "center",
      paddingVertical: 6,
    },
  }),
};
