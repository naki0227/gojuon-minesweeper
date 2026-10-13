import { forwardRef } from "react";
import {
  Pressable as NativePressable,
  type PressableProps,
  type View,
} from "react-native";

import { playSound } from "../sound/sounds";

type Props = PressableProps & {
  // Skip the tap sound, for presses that make their own sound (answer,
  // board tiles) or are not really buttons (a popup's backdrop).
  silent?: boolean;
};

// Pressable with a light tap sound. Use it for every button.
export const Pressable = forwardRef<View, Props>(function TapPressable(
  { silent, onPress, ...props },
  ref,
) {
  return (
    <NativePressable
      ref={ref}
      {...props}
      onPress={
        onPress && !silent
          ? (event) => {
              playSound("tap");
              onPress(event);
            }
          : onPress
      }
    />
  );
});
