import { Animated, StyleSheet, Text, View } from "react-native";

import { COUNT_COLOR_MANY, COUNT_COLORS } from "../theme/colors";
import { tileStyles } from "../components/tileStyles";

export type MiniCell = {
  char: string;
  // 0 = closed, 1 = open. Animated so scenes can flip cells in sequence.
  open: Animated.Value;
  mine?: boolean;
  count?: number;
  hinted?: boolean;
};

const SIZE = 46;
const RADIUS = Math.max(5, SIZE * 0.2);

// A 3x3 piece of the board for the tutorial, drawn with the game's own
// tile styles (see BoardTile) but driven by the scenes' animations.
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
  const count = cell.count ?? 0;
  const countColor = COUNT_COLORS[count] ?? COUNT_COLOR_MANY;
  const face = [tileStyles.face, { borderRadius: RADIUS }];
  return (
    <Animated.View style={[styles.tile, { transform: [{ scaleX: flip }] }]}>
      <Animated.View
        style={[
          face,
          tileStyles.closed,
          cell.hinted && tileStyles.hinted,
          { opacity: closedOpacity },
        ]}
      >
        <Text style={[tileStyles.closedChar, { fontSize: SIZE * 0.5 }]}>
          {cell.char}
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          face,
          cell.mine ? tileStyles.mine : tileStyles.safe,
          { opacity: openOpacity },
        ]}
      >
        {cell.mine ? (
          <>
            <View style={[tileStyles.mineDot, styles.mineDot]} />
            <Text style={[tileStyles.mineChar, { fontSize: SIZE * 0.48 }]}>
              {cell.char}
            </Text>
          </>
        ) : (
          <>
            <Text style={[tileStyles.openChar, styles.openChar]}>
              {cell.char}
            </Text>
            {count ? (
              <Text
                style={[tileStyles.count, styles.count, { color: countColor }]}
              >
                {count}
              </Text>
            ) : null}
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

// Size-dependent values, computed the way BoardTile does for its size.
const styles = StyleSheet.create({
  board: {
    width: SIZE * 3 + 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignSelf: "center",
  },
  tile: { width: SIZE, height: SIZE },
  mineDot: {
    width: SIZE * 0.62,
    height: SIZE * 0.62,
    borderRadius: SIZE * 0.31,
  },
  openChar: { fontSize: SIZE * 0.3, top: SIZE * 0.04, left: SIZE * 0.1 },
  count: { fontSize: SIZE * 0.5, marginTop: SIZE * 0.18 },
});
