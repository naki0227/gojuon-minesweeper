import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { Pressable } from "../components/TapPressable";
import { LOCALE } from "../i18n";
import { colors } from "../theme/colors";
import { HALLOWEEN, seasonOf } from "../theme/season";
import { currentPuzzleDate } from "./dates";
import { readDailyMemory } from "./storage";
import { currentStreak } from "./streak";

// The way into 今日の一問 from the home screen. The puzzle is Japanese,
// so the card shows only in the Japanese app (the web has /daily/ pages).
export function DailyCard() {
  const [state, setState] = useState<{ streak: number; done: boolean }>({
    streak: 0,
    done: false,
  });
  useFocusEffect(
    useCallback(() => {
      const today = currentPuzzleDate(new Date());
      void readDailyMemory().then((memory) =>
        setState({
          streak: currentStreak(memory.streak, today),
          done: memory.play?.date === today && memory.play.phase !== "playing",
        }),
      );
    }, []),
  );
  if (Platform.OS === "web" || LOCALE !== "ja") return null;
  const halloween = seasonOf(currentPuzzleDate(new Date())) === "halloween";
  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.card, halloween && styles.nightCard]}
      onPress={() => router.push("/today")}
    >
      <View style={styles.text}>
        <Text style={[styles.title, halloween && styles.nightTitle]}>
          {halloween ? "🎃 ハロウィン週の一問" : "今日の一問"}
        </Text>
        <Text style={[styles.sub, halloween && styles.nightSub]}>
          {state.done ? "今日はクリア済み。また明日！" : "毎朝7時に新しい問題"}
        </Text>
      </View>
      {state.streak > 0 ? (
        <Text style={styles.streak}>🔥{state.streak}日</Text>
      ) : null}
      <Text style={styles.go}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  text: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  sub: { color: "#536875", fontSize: 12, fontWeight: "700" },
  streak: { color: colors.accent, fontSize: 15, fontWeight: "900" },
  go: { color: colors.primary, fontSize: 24, fontWeight: "900" },
  // Halloween week: the night sky with a flat pumpkin shadow.
  nightCard: {
    backgroundColor: HALLOWEEN.night,
    borderColor: HALLOWEEN.night,
    shadowColor: HALLOWEEN.pumpkin,
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  nightTitle: { color: HALLOWEEN.text },
  nightSub: { color: HALLOWEEN.sub },
});
