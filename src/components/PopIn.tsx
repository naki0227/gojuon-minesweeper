import { useEffect, useState, type ReactNode } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

import { USE_NATIVE_DRIVER, useReducedMotion } from "./motion";

// Springs its children in from a smaller size when it mounts.
export function PopIn({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useState(() => new Animated.Value(0.6))[0];

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 14,
      bounciness: 14,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [scale]);

  return (
    <Animated.View
      style={[style, reducedMotion ? null : { transform: [{ scale }] }]}
    >
      {children}
    </Animated.View>
  );
}
