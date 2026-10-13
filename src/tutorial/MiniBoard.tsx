import { Animated, StyleSheet, Text, View } from "react-native";

import { COUNT_COLORS } from "../components/motion";

export type MiniCell = {
  char: string;
  // 0 = closed, 1 = open. Animated so scenes can flip cells in sequence.
  open: Animated.Value;
  mine?: boolean;
  count?: number;
  hinted?: boolean;
};

const SIZE = 46;

// A 3x3 piece of the board for the tutorial: the same look as the game
// (white closed tiles, grey open ones, orange mines) without game logic.
export function MiniBoard({ cells }: { cells: readonly MiniCell[] }) {
  return (
    <View style={styles.board}>
      {cells.map((cell, index) => (
        <MiniTile key={`${cell.char}-${index}`} cell={cell} />
      ))}
    </View>
  );
}

function MiniTile({ cell }: { cell: MiniCell }) {
  const flip = cell.open.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.05, 1],
  });
  const closedOpacity = cell.open.interpolate({
    inputRange: [0, 0.5, 0.51, 1],
    outputRange: [1, 1, 0, 0],
  });
  const openOpacity = cell.open.interpolate({
    inputRange: [0, 0.5, 0.51, 1],
    outputRange: [0, 0, 1, 1],
  });
  const countColor =
    COUNT_COLORS[Math.min(cell.count ?? 0, COUNT_COLORS.length - 1)];
  return (
    <Animated.View style={[styles.tile, { transform: [{ scaleX: flip }] }]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.face,
          styles.closed,
          cell.hinted && styles.hinted,
          { opacity: closedOpacity },
        ]}
      >
        <Text style={styles.char}>{cell.char}</Text>
      </Animated.View>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.face,
          cell.mine ? styles.mine : styles.safe,
          { opacity: openOpacity },
        ]}
      >
        <Text style={[styles.char, cell.mine && styles.mineChar]}>
          {cell.char}
        </Text>
        {cell.mine ? null : (
          <Text style={[styles.count, { color: countColor }]}>
            {cell.count ?? 0}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: SIZE * 3 + 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignSelf: "center",
  },
  tile: { width: SIZE, height: SIZE },
  face: {
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closed: {
    backgroundColor: "#ffffff",
    borderColor: "#c9d4dc",
    borderBottomWidth: 3,
  },
  hinted: { backgroundColor: "#e5f6ea", borderColor: "#8fcf9f" },
  safe: { backgroundColor: "#eef2f5", borderColor: "#dbe3ea" },
  mine: { backgroundColor: "#ffe6d2", borderColor: "#f0a46b" },
  char: { color: "#173f55", fontSize: 17, fontWeight: "900" },
  mineChar: { color: "#b5531a" },
  count: {
    position: "absolute",
    right: 4,
    bottom: 1,
    fontSize: 12,
    fontWeight: "900",
  },
});
