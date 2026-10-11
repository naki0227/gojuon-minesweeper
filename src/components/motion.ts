import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

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
export const COUNT_COLORS = ["#9aa7b0", "#3388b0", "#2f9e6a", "#e97817"];
export const COUNT_COLOR_MANY = "#c2410c";
