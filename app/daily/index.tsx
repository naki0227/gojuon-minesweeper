import { Link } from "expo-router";
import Head from "expo-router/head";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { docPageStyles } from "../../src/components/docPageStyles";
import { questionPrompt } from "../../src/data/questions";
import {
  DAILY_SCHEDULE,
  dailyQuestion,
  shortDate,
} from "../../src/daily/schedule";
import { useJapanToday } from "../../src/daily/useJapanToday";
import { colors } from "../../src/theme/colors";

// Today's puzzle and the ones before it, newest first.
export default function DailyListScreen() {
  const today = useJapanToday();
  const entries = today
    ? DAILY_SCHEDULE.filter((entry) => entry.date <= today).reverse()
    : [];
  return (
    <SafeAreaView style={styles.safeArea}>
      <Head>
        <title>今日の一問 | 五十音マインスイーパー</title>
        <meta
          name="description"
          content="毎日1問、盤面の数字から答えを推理する「今日の一問」。"
        />
      </Head>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.title}>今日の一問</Text>
        <Text style={styles.body}>
          毎日0時に新しい問題。開いたマスの数字から答えを推理しよう。
        </Text>
        <View style={styles.list}>
          {entries.map((entry, index) => (
            <Link
              key={entry.date}
              href={`/daily/${entry.date}`}
              style={[styles.row, index === 0 && styles.rowToday]}
            >
              <Text style={styles.rowDate}>
                {index === 0 && entry.date === today
                  ? "今日"
                  : shortDate(entry.date)}
              </Text>
              <Text style={styles.rowPrompt}>
                {"  "}
                {questionPrompt(dailyQuestion(entry))}
              </Text>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  ...docPageStyles,
  ...StyleSheet.create({
    list: { gap: 8 },
    row: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 14,
    },
    rowToday: {
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primarySoft,
    },
    rowDate: { color: colors.primary, fontWeight: "900", fontSize: 14 },
    rowPrompt: { color: colors.ink, fontWeight: "800", fontSize: 16 },
  }),
};
