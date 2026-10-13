import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Platform } from "react-native";
import { colors } from "../theme/colors";

// React Native Web has no native animation driver.
export const USE_NATIVE_DRIVER = Platform.OS !== "web";

// True when the player asked the OS to reduce motion; effects are skipped.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) {
        setReduced(value);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

// Colors for the number of mines around an opened cell.
export const COUNT_COLORS = [
  "#9aa7b0",
  colors.primary,
  colors.success,
  colors.accentStrong,
];
export const COUNT_COLOR_MANY = colors.danger;

// Side-to-side board shake for a mine hit, driven by `progress` 0 → 1.
export function shakeTranslateX(progress: Animated.Value) {
  return progress.interpolate({
    inputRange: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
    outputRange: [0, -9, 8, -6, 5, -3, 2, 0],
  });
}
