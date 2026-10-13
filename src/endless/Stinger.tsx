import { Pressable, StyleSheet, Text, View } from "react-native";

import { PopIn } from "../components/PopIn";
import { EndlessBoard } from "./EndlessBoard";
import type { EndlessState } from "./engine";
import type { StingerKind } from "./pauses";
import { colors } from "../theme/colors";

const COPY: Record<StingerKind, { title: string; color: string }> = {
  start: { title: "START", color: colors.primary },
  clear: { title: "CLEAR!", color: colors.success },
  over: { title: "GAME OVER", color: colors.danger },
};

type Props = {
  game: EndlessState;
  kind: StingerKind;
  mineChars: ReadonlySet<string>;
  hintedChars: ReadonlySet<string>;
  onContinue: () => void;
};

// Keeps the board as it was at that moment and shows the word over it;
// a tap moves on to the next panel.
export function Stinger({
  game,
  kind,
  mineChars,
  hintedChars,
  onContinue,
}: Props) {
  const { title, color } = COPY[kind];
  const detail =
    kind === "start"
      ? `第${game.solved + 1}問`
      : kind === "clear"
        ? game.message.replace(/。次の問題に進もう。$/, "")
        : "ライフがなくなった";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}。タップして次へ`}
      onPress={onContinue}
      style={styles.wrap}
    >
      <View pointerEvents="none">
        <EndlessBoard
          game={game}
          mineChars={mineChars}
          hintedChars={hintedChars}
        />
      </View>
      <View style={styles.veil} pointerEvents="none">
        <PopIn style={styles.card}>
          <Text style={[styles.title, { color }]}>{title}</Text>
          <Text style={styles.detail}>{detail}</Text>
          <Text style={styles.tap}>タップして次へ</Text>
        </PopIn>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 110 },
  veil: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247, 250, 252, 0.55)",
  },
  card: {
    minWidth: 220,
    alignItems: "center",
    gap: 4,
    borderRadius: 18,
    backgroundColor: colors.white,
    paddingHorizontal: 26,
    paddingVertical: 18,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: { fontSize: 34, fontWeight: "900", letterSpacing: 2 },
  detail: { color: "#3e4c56", fontSize: 15, fontWeight: "800" },
  tap: { color: "#8a9aa5", fontSize: 12, fontWeight: "700", marginTop: 4 },
});
