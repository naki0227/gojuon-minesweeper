import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Pressable } from "../components/TapPressable";
import { menuStyles } from "../components/menuStyles";
import { colors } from "../theme/colors";
import type { PuzzleEntry } from "./pack";
import type { PuzzleRecords } from "./storage";

export function stars(count: number): string {
  return "★".repeat(count) + "☆".repeat(3 - count);
}

// The 詰め五十音 puzzles, easy to hard, with the best stars so far.
export function PuzzleList({
  pack,
  records,
  onPick,
  onBack,
}: {
  pack: readonly PuzzleEntry[];
  records: PuzzleRecords;
  onPick: (index: number) => void;
  onBack: () => void;
}) {
  const total = pack.reduce((sum, p) => sum + (records[p.id] ?? 0), 0);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.title}>詰め五十音</Text>
        <Text style={styles.lead}>
          開いているマスの数字から、答えを最短の手数で確定させるパズル。目標の手数以内で解ければ★3つ。
        </Text>
        <Text style={styles.total}>
          ★{total} / {pack.length * 3}
        </Text>
        <View style={styles.grid}>
          {pack.map((entry, index) => {
            const got = records[entry.id] ?? 0;
            return (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                accessibilityLabel={`第${index + 1}問 目標${entry.par}手`}
                onPress={() => onPick(index)}
                style={[styles.cell, got > 0 && styles.cellDone]}
              >
                <Text style={styles.cellNumber}>{index + 1}</Text>
                <Text style={styles.cellPar}>{entry.par}手</Text>
                <Text style={styles.cellStars}>{stars(got)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          style={styles.back}
        >
          <Text style={styles.backText}>もどる</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  ...menuStyles,
  ...StyleSheet.create({
    total: { color: colors.accentStrong, fontSize: 16, fontWeight: "900" },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    cell: {
      width: 76,
      height: 76,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.white,
    },
    cellDone: { backgroundColor: "#fff6ea" },
    cellNumber: { color: colors.ink, fontSize: 20, fontWeight: "900" },
    cellPar: { color: colors.muted, fontSize: 11 },
    cellStars: { color: colors.accentStrong, fontSize: 12 },
  }),
};
