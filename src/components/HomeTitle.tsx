import { StyleSheet, Text, View } from "react-native";

import { DailyCard } from "../daily/DailyCard";
import { SoundButton } from "../sound/SoundButton";
import { tr } from "../i18n";
import { colors } from "../theme/colors";

const S = tr({
  ja: { title: "マインスイーパー" },
  en: { title: "Minesweeper" },
});

// The 五十音 tiles and title at the top of the home screen, with the sound
// settings on the right, and the way into 今日の一問 below.
export function HomeTitle() {
  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <View style={styles.titleRow} accessibilityRole="header">
          <View style={styles.tiles}>
            <Text style={styles.tile}>五</Text>
            <Text style={styles.tile}>十</Text>
            <Text style={[styles.tile, styles.accent]}>音</Text>
          </View>
          <Text style={styles.text}>{S.title}</Text>
        </View>
        <SoundButton />
      </View>
      <DailyCard />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  tiles: { flexDirection: "row", gap: 3 },
  tile: {
    width: 30,
    height: 30,
    backgroundColor: colors.ink,
    color: colors.background,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 30,
    textAlign: "center",
    overflow: "hidden",
  },
  accent: { backgroundColor: colors.primary, color: colors.white },
  text: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.8,
    paddingBottom: 1,
  },
});
