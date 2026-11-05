import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Pressable } from "../components/TapPressable";
import { GOJUON_GRID } from "../game/gojuon";
import { colors } from "../theme/colors";

type Props = {
  needed: readonly string[];
  opened: readonly string[];
  hint: string | null;
  disabled: boolean;
  onOpen: (char: string) => void;
};

const GAP = 4;
const COLUMNS = GOJUON_GRID[0]?.length ?? 10;

// The 五十音 board for こどもモード: big letters and no numbers. A letter
// of the word opens orange, any other opens pale.
export function KidsBoard({ needed, opened, hint, disabled, onOpen }: Props) {
  const [width, setWidth] = useState(0);
  const size = width > 0 ? (width - GAP * (COLUMNS - 1)) / COLUMNS : 0;
  return (
    <View
      style={styles.board}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {size > 0
        ? GOJUON_GRID.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((char, column) => {
                if (!char) {
                  return (
                    <View
                      key={`empty-${column}`}
                      style={{ width: size, height: size }}
                    />
                  );
                }
                const isOpen = opened.includes(char);
                const hit = isOpen && needed.includes(char);
                return (
                  <Pressable
                    key={char}
                    accessibilityRole="button"
                    accessibilityLabel={
                      hit
                        ? `${char}、あたり`
                        : isOpen
                          ? `${char}、はずれ`
                          : char
                    }
                    disabled={disabled || isOpen}
                    onPress={() => onOpen(char)}
                    silent
                    style={[
                      styles.tile,
                      { width: size, height: size, borderRadius: size * 0.22 },
                      isOpen && (hit ? styles.hit : styles.miss),
                      hint === char && styles.hint,
                    ]}
                  >
                    <Text
                      style={[
                        styles.char,
                        { fontSize: size * 0.52 },
                        hit && styles.hitChar,
                        isOpen && !hit && styles.missChar,
                      ]}
                    >
                      {char}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { width: "100%", maxWidth: 560, alignSelf: "center", gap: GAP },
  row: { flexDirection: "row", gap: GAP },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  hit: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  miss: { backgroundColor: "#eef2f5", borderColor: "#eef2f5" },
  hint: { borderColor: "#ffcf4a", borderWidth: 4, backgroundColor: "#fff6d6" },
  char: { color: colors.ink, fontWeight: "900" },
  hitChar: { color: colors.white },
  missChar: { color: "#b9c4cc" },
});
