import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COUNT_COLOR_MANY, COUNT_COLORS, USE_NATIVE_DRIVER } from "./motion";

type Props = {
  char: string;
  size: number;
  opened: boolean;
  hinted?: boolean;
  mine: boolean;
  multiplicity: number;
  count: number | null;
  delay: number;
  disabled: boolean;
  reducedMotion: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

const FLIP_MS = 260;
const SPARKS = 8;

export function BoardTile({
  char,
  size,
  opened,
  hinted = false,
  mine,
  multiplicity,
  count,
  delay,
  disabled,
  reducedMotion,
  accessibilityLabel,
  onPress,
}: Props) {
  const flip = useState(() => new Animated.Value(opened ? 1 : 0))[0];
  const press = useState(() => new Animated.Value(0))[0];
  const burst = useState(() => new Animated.Value(0))[0];
  const wasOpened = useRef(opened);

  useEffect(() => {
    if (opened === wasOpened.current) {
      return;
    }
    wasOpened.current = opened;

    if (!opened || reducedMotion) {
      flip.setValue(opened ? 1 : 0);
      return;
    }

    const animations = [
      Animated.timing(flip, {
        toValue: 1,
        duration: FLIP_MS,
        delay,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ];
    if (mine) {
      burst.setValue(0);
      animations.push(
        Animated.timing(burst, {
          toValue: 1,
          duration: 650,
          delay: delay + FLIP_MS / 2,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      );
    }
    Animated.parallel(animations).start();
  }, [opened, mine, delay, reducedMotion, flip, burst]);

  function animatePress(toValue: number) {
    Animated.spring(press, {
      toValue,
      speed: 40,
      bounciness: toValue ? 0 : 12,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }

  const closedOpacity = flip.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: [1, 1, 0, 0],
  });
  const openOpacity = flip.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: [0, 0, 1, 1],
  });
  const rotateY = flip.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: ["0deg", "90deg", "-90deg", "0deg"],
  });
  const lift = flip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.18, 1],
  });
  const pressScale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });

  const radius = Math.max(5, size * 0.2);
  const countColor =
    count === null
      ? COUNT_COLORS[0]
      : (COUNT_COLORS[count] ?? COUNT_COLOR_MANY);
  const faceStyle = { borderRadius: radius };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => !disabled && !reducedMotion && animatePress(1)}
      onPressOut={() => !reducedMotion && animatePress(0)}
      style={[styles.slot, { width: size, height: size, zIndex: mine ? 2 : 1 }]}
    >
      {mine && opened ? <Burst size={size} progress={burst} /> : null}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              { perspective: 600 },
              { scale: Animated.multiply(lift, pressScale) },
              { rotateY },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.face,
            styles.closed,
            hinted ? styles.hinted : null,
            faceStyle,
            { opacity: closedOpacity },
          ]}
        >
          <Text style={[styles.closedChar, { fontSize: size * 0.5 }]}>
            {char}
          </Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.face,
            mine ? styles.mine : styles.safe,
            faceStyle,
            { opacity: openOpacity },
          ]}
        >
          {mine ? (
            <>
              <View
                style={[
                  styles.mineDot,
                  {
                    width: size * 0.62,
                    height: size * 0.62,
                    borderRadius: size * 0.31,
                  },
                ]}
              />
              <Text style={[styles.mineChar, { fontSize: size * 0.48 }]}>
                {char}
              </Text>
              {multiplicity > 1 ? (
                <Text
                  style={[
                    styles.mineMultiplicity,
                    { fontSize: Math.max(9, size * 0.2) },
                  ]}
                >
                  ×{multiplicity}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.openChar,
                  { fontSize: size * 0.3, top: size * 0.04, left: size * 0.1 },
                ]}
              >
                {char}
              </Text>
              {count ? (
                <Text
                  style={[
                    styles.count,
                    {
                      fontSize: size * 0.5,
                      color: countColor,
                      marginTop: size * 0.18,
                    },
                  ]}
                >
                  {count}
                </Text>
              ) : null}
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
// A ring and sparks that fly out of a mine when it opens.
function Burst({ size, progress }: { size: number; progress: Animated.Value }) {
  const fade = progress.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [0, 1, 0.8, 0],
  });
  const ringScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 2.8],
  });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: Math.max(2, size * 0.1),
            opacity: fade,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      {Array.from({ length: SPARKS }, (_, index) => {
        const angle = (index / SPARKS) * Math.PI * 2 + 0.3;
        const distance = size * (1.3 + (index % 3) * 0.35);
        const spark = size * (index % 2 ? 0.16 : 0.22);
        return (
          <Animated.View
            key={index}
            style={[
              styles.spark,
              {
                width: spark,
                height: spark,
                borderRadius: index % 3 === 0 ? 2 : spark / 2,
                left: size / 2 - spark / 2,
                top: size / 2 - spark / 2,
                backgroundColor: index % 2 ? "#ffcf4a" : "#e98a2f",
                opacity: fade,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(angle) * distance],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(angle) * distance],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  slot: {
    position: "relative",
  },
  face: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    overflow: "hidden",
  },
  closed: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#c9d5df",
    borderBottomWidth: 3,
    borderBottomColor: "#bccbd6",
  },
  hinted: {
    backgroundColor: "#d4f5dd",
    borderColor: "#5db47a",
    borderBottomColor: "#379361",
  },
  closedChar: {
    color: "#152534",
    fontWeight: "800",
    marginTop: 1,
  },
  safe: {
    backgroundColor: "#e6edf2",
    borderWidth: 1,
    borderColor: "#d8e0e6",
  },
  openChar: {
    position: "absolute",
    color: "#8696a1",
    fontWeight: "800",
  },
  count: {
    fontWeight: "900",
  },
  mine: {
    backgroundColor: "#e98a2f",
    borderWidth: 1,
    borderColor: "#e97817",
    borderBottomWidth: 3,
  },
  mineDot: {
    position: "absolute",
    backgroundColor: "#c96a14",
  },
  mineChar: {
    color: "#ffffff",
    fontWeight: "900",
  },
  mineMultiplicity: {
    position: "absolute",
    right: 2,
    bottom: 1,
    color: "#ffffff",
    fontWeight: "900",
  },
  ring: {
    position: "absolute",
    left: 0,
    top: 0,
    borderColor: "#ffcf4a",
  },
  spark: {
    position: "absolute",
  },
});