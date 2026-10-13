import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "../theme/colors";

type Props = {
  visible: boolean;
  // Called on a backdrop tap or the Android back button. Without it the
  // popup only closes through its own buttons.
  onDismiss?: () => void;
  cardStyle?: StyleProp<ViewStyle>;
  onCardLayout?: (event: LayoutChangeEvent) => void;
  children: ReactNode;
};

// A centered card over a dimmed backdrop, used for every in-app popup.
export function Popup({
  visible,
  onDismiss,
  cardStyle,
  onCardLayout,
  children,
}: Props) {
  const card = [styles.card, cardStyle];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        disabled={!onDismiss}
        accessible={false}
      >
        {onDismiss ? (
          // Taps inside the card must not reach the backdrop.
          <Pressable onPress={() => {}} onLayout={onCardLayout} style={card}>
            {children}
          </Pressable>
        ) : (
          <View onLayout={onCardLayout} style={card}>
            {children}
          </View>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(16, 36, 51, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "88%",
    borderRadius: 18,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
});
