import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import { USE_NATIVE_DRIVER } from "./motion";
import { colors } from "../theme/colors";

const COLORS = ["#ffcf4a", colors.primary, colors.accent, "#7fd1b9", "#152534"];
const PIECES = 60;

// Paper confetti bursting up from both lower corners, shown once on a win.
export function Confetti() {
  const { width, height } = useWindowDimensions();
  const progress = useState(() => new Animated.Value(0))[0];

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, index) => {
        // Fixed pseudo-random values so the burst looks scattered but stable.
        const random = (salt: number) => {
          const seed = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
          return seed - Math.floor(seed);
        };
        const fromLeft = index % 2 === 0;
        const start = random(1) * 0.18;
        return {
          fromLeft,
          start,
          dx: (0.15 + random(2) * 0.75) * width * (fromLeft ? 1 : -1),
          peak: height * (0.4 + random(3) * 0.45),
          spin: (fromLeft ? 1 : -1) * (360 + random(4) * 900),
          size: 7 + random(5) * 9,
          color: COLORS[Math.floor(random(6) * COLORS.length)],
        };
      }),
    [width, height],
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      easing: Easing.linear,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            left: piece.fromLeft ? -10 : width + 10,
            top: height,
            width: piece.size,
            height: piece.size * 0.55,
            borderRadius: 2,
            backgroundColor: piece.color,
            opacity: progress.interpolate({
              inputRange: [0, piece.start, piece.start + 0.01, 0.8, 1],
              outputRange: [0, 0, 1, 1, 0],
            }),
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, piece.start, 1],
                  outputRange: [0, 0, piece.dx],
                }),
              },
              {
                // Up fast, then drift down.
                translateY: progress.interpolate({
                  inputRange: [0, piece.start, piece.start + 0.35, 1],
                  outputRange: [0, 0, -piece.peak, -piece.peak * 0.45],
                  easing: Easing.out(Easing.quad),
                }),
              },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${piece.spin}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
