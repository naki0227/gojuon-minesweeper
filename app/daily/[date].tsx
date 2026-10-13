import { Link, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { docPageStyles } from "../../src/components/docPageStyles";
import { questionPrompt } from "../../src/data/questions";
import {
  DAILY_SCHEDULE,
  dailyAnswer,
  dailyEntry,
  dailyQuestion,
  dailyUrl,
  shortDate,
} from "../../src/daily/schedule";
import { useJapanToday } from "../../src/daily/useJapanToday";
import { appStoreUrl, SITE_URL } from "../../src/links/site";
import { colors } from "../../src/theme/colors";

export function generateStaticParams(): { date: string }[] {
  return DAILY_SCHEDULE.map((entry) => ({ date: entry.date }));
}

// One day of 今日の一問: the image people saw on X, and the answer once
// the day is over.
export default function DailyScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const entry = dailyEntry(date);
  const today = useJapanToday();
  if (!entry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <Text style={styles.title}>問題が見つかりません</Text>
          <Link href="/daily" style={styles.link}>
            今日の一問へ
          </Link>
        </View>
      </SafeAreaView>
    );
  }
  const prompt = questionPrompt(dailyQuestion(entry));
  const title = `今日の一問 ${shortDate(entry.date)}「${prompt}」`;
  const image = `${SITE_URL}/daily/${entry.date}/square.png`;
  const revealed = today !== null && today > entry.date;
  const upcoming = today !== null && today < entry.date;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Head>
        <title>{`${title} | 五十音マインスイーパー`}</title>
        <meta
          name="description"
          content={`お題「${prompt}」。開いたマスの数字から答えを推理しよう。`}
        />
        <link rel="canonical" href={dailyUrl(entry.date)} />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={dailyUrl(entry.date)} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={image} />
      </Head>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>今日の一問 {shortDate(entry.date)}</Text>
        <Text style={styles.title}>{prompt}</Text>
        {upcoming ? (
          <Text style={styles.body}>この問題はまだ公開前です。</Text>
        ) : (
          <Image
            source={{ uri: image }}
            style={styles.image}
            accessibilityLabel={`${prompt}の盤面`}
          />
        )}
        <View style={styles.answerCard}>
          {revealed ? (
            <>
              <Text style={styles.answerLabel}>答え</Text>
              <Text style={styles.answer}>{dailyAnswer(entry)}</Text>
              {entry.trivia ? (
                <Text style={styles.body}>{entry.trivia}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.body}>
              開いたマスの数字は、周り8マスにある答えの文字の数。オレンジのマスは答えに入っている文字です。答えは翌日このページで公開します。
            </Text>
          )}
        </View>
        <View style={styles.links}>
          <Link href="/" style={styles.cta}>
            ブラウザで遊ぶ
          </Link>
          <Link href={appStoreUrl("web_daily")} style={styles.cta}>
            iPhoneアプリで遊ぶ
          </Link>
          <Link href="/daily" style={styles.link}>
            ほかの日の問題
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  ...docPageStyles,
  ...StyleSheet.create({
    eyebrow: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 2,
    },
    image: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
    },
    answerCard: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      padding: 18,
      gap: 8,
    },
    answerLabel: { color: colors.muted, fontSize: 13, fontWeight: "800" },
    answer: { color: colors.accent, fontSize: 32, fontWeight: "900" },
    links: { gap: 10 },
    cta: {
      color: colors.white,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      textAlign: "center",
      fontWeight: "800",
      fontSize: 15,
    },
  }),
};
