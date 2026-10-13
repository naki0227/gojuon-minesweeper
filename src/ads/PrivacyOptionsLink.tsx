import { StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";
import { Pressable } from "../components/TapPressable";

// The link both platforms' AdPrivacyOptionsButton render; only what a
// press opens differs.
export function PrivacyOptionsLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      <Text style={styles.text}>広告のプライバシー設定を変更する</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    minHeight: 38,
    justifyContent: "center",
  },
  text: { color: colors.link, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
