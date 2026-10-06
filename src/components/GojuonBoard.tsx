import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { Question } from "../data/questions";
import { adjacentMineCount } from "../game/engine";
import { GOJUON_GRID } from "../game/gojuon";

type Props = {
  question: Question;
  openedChars: readonly string[];
  mineChars: ReadonlySet<string>;
  canOpen: boolean;
  onOpen: (char: string) => void;
};

export function GojuonBoard({
  question,
  openedChars,
  mineChars,
  canOpen,
  onOpen,
}: Props) {
  const opened = useMemo(() => new Set(openedChars), [openedChars]);

  return (
    <View style={styles.board}>
      {GOJUON_GRID.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((char, columnIndex) => {
            if (char === null) {
              return (
                <View
                  key={`empty-${rowIndex}-${columnIndex}`}
                  style={[styles.cell, styles.emptyCell]}
                />
              );
            }

            const isOpened = opened.has(char);
            const isMine = isOpened && mineChars.has(char);
            const mineCount =
              isOpened && !isMine ? adjacentMineCount(question, char) : null;
            const disabled = !canOpen || isOpened;

            const dynamicStyle: ViewStyle = isMine
              ? styles.mineCell
              : isOpened
                ? styles.safeCell
                : styles.closedCell;

            const stateLabel = !isOpened
              ? ""
              : isMine
                ? " 地雷"
                : ` セーフ 周囲の地雷${mineCount}個`;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${char}${stateLabel}`}
                disabled={disabled}
                key={char}
                onPress={() => onOpen(char)}
                style={({ pressed }) => [
                  styles.cell,
                  dynamicStyle,
                  pressed && !disabled ? styles.pressedCell : null,
                ]}
              >
                <Text
                  style={[
                    styles.char,
                    isOpened ? styles.openedChar : null,
                    isMine ? styles.mineChar : null,
                  ]}
                >
                  {char}
                </Text>

                {isMine ? (
                  <Text style={styles.mineMark}>●</Text>
                ) : isOpened ? (
                  <Text style={styles.mineCount}>{mineCount}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    gap: 3,
  },
  row: {
    flexDirection: "row",
    gap: 3,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    minWidth: 0,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  emptyCell: {
    borderColor: "transparent",
  },
  closedCell: {
    backgroundColor: "#ffffff",
    borderColor: "#c9d5df",
  },
  safeCell: {
    backgroundColor: "#eef2f5",
    borderColor: "#d8e0e6",
  },
  mineCell: {
    backgroundColor: "#fff0df",
    borderColor: "#e98a2f",
  },
  pressedCell: {
    opacity: 0.65,
  },
  char: {
    color: "#152534",
    fontWeight: "700",
    fontSize: 17,
    transform: [{ translateY: -3 }],
  },
  openedChar: {
    color: "#71808c",
  },
  mineChar: {
    color: "#8f4300",
  },
  mineCount: {
    position: "absolute",
    bottom: 2,
    color: "#263f50",
    fontSize: 10,
    fontWeight: "900",
  },
  mineMark: {
    position: "absolute",
    bottom: 2,
    color: "#e97817",
    fontSize: 7,
  },
});
