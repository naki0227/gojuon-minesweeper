import { useEffect, useMemo, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import type { QuestionLanguage } from "../data/types";
import { getBoardGrid } from "../game/board";
import { BoardTile } from "./BoardTile";
import { USE_NATIVE_DRIVER, useReducedMotion } from "./motion";

type Props = {
  language: QuestionLanguage;
  openedChars: readonly string[];
  mineChars: ReadonlySet<string>;
  // Mines around an opened safe cell. Local play computes it from the
  // question; online play gets it from the server.
  mineCount: (char: string) => number;
  canOpen: boolean;
  onOpen: (char: string) => void;
};

const GAP = 3;
// Delay between rings of a chain opening.
const WAVE_STEP_MS = 55;

export function CharacterBoard({
  language,
  openedChars,
  mineChars,
  mineCount: countMines,
  canOpen,
  onOpen,
}: Props) {
  const opened = useMemo(() => new Set(openedChars), [openedChars]);
  const grid = getBoardGrid(language);
  const columns = grid[0]?.length ?? 1;
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const tileSize = width > 0 ? (width - GAP * (columns - 1)) / columns : 0;

  const positions = useMemo(() => {
    const map = new Map<string, { row: number; column: number }>();
    grid.forEach((row, rowIndex) =>
      row.forEach((char, column) => {
        if (char) {
          map.set(char, { row: rowIndex, column });
        }
      }),
    );
    return map;
  }, [grid]);

  // Cells opened by the latest move flip outward from the tapped cell, and
  // the whole board shakes when a mine opens. Worked out once per change of
  // the opened set, while rendering, so the tiles get their delays in time.
  const [tapped, setTapped] = useState<string | null>(null);
  const [wave, setWave] = useState({
    opened,
    delays: new Map<string, number>(),
    mineHits: 0,
  });
  if (wave.opened !== opened) {
    const origin = tapped ? positions.get(tapped) : undefined;
    const delays = new Map<string, number>();
    let hitMine = false;
    for (const char of opened) {
      if (wave.opened.has(char)) {
        continue;
      }
      hitMine ||= mineChars.has(char);
      const at = positions.get(char);
      if (origin && at) {
        const distance = Math.max(
          Math.abs(at.row - origin.row),
          Math.abs(at.column - origin.column),
        );
        delays.set(char, distance * WAVE_STEP_MS);
      }
    }
    setWave({
      opened,
      delays,
      mineHits: wave.mineHits + (hitMine ? 1 : 0),
    });
  }

  const shake = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (wave.mineHits === 0 || reducedMotion) {
      return;
    }
    shake.setValue(0);
    Animated.timing(shake, {
      toValue: 1,
      duration: 450,
      delay: 120,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [wave.mineHits, reducedMotion, shake]);

  const shakeX = shake.interpolate({
    inputRange: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
    outputRange: [0, -9, 8, -6, 5, -3, 2, 0],
  });

  return (
    <Animated.View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.board,
        language === "en" ? styles.englishBoard : null,
        { transform: [{ translateX: shakeX }] },
      ]}
    >
      {tileSize > 0
        ? grid.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {row.map((char, columnIndex) => {
                if (char === null) {
                  return (
                    <View
                      key={`empty-${rowIndex}-${columnIndex}`}
                      style={{ width: tileSize, height: tileSize }}
                    />
                  );
                }

                const isOpened = opened.has(char);
                const isMine = isOpened && mineChars.has(char);
                const mineCount = isOpened && !isMine ? countMines(char) : null;
                const stateLabel = !isOpened
                  ? ""
                  : isMine
                    ? " 地雷"
                    : ` セーフ 周囲の地雷${mineCount}個`;

                return (
                  <BoardTile
                    key={char}
                    char={char}
                    size={tileSize}
                    opened={isOpened}
                    mine={isMine}
                    count={mineCount}
                    delay={wave.delays.get(char) ?? 0}
                    disabled={!canOpen || isOpened}
                    reducedMotion={reducedMotion}
                    accessibilityLabel={`${char}${stateLabel}`}
                    onPress={() => {
                      setTapped(char);
                      onOpen(char);
                    }}
                  />
                );
              })}
            </View>
          ))
        : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    gap: GAP,
  },
  englishBoard: {
    maxWidth: 430,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
  },
});
