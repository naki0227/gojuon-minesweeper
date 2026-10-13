import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TutorialModal } from "../tutorial/TutorialModal";
import { colors } from "../theme/colors";

// A small "ルール" link that opens the animated tutorial, on every
// platform, so the match stays on one screen.
export function RuleHelp() {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="ルールを見る"
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={styles.button}
      >
        <MaterialIcons name="help-outline" size={16} color={colors.help} />
        <Text style={styles.label}>ルール</Text>
      </Pressable>
      <TutorialModal visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
  },
  label: { color: colors.help, fontSize: 12, fontWeight: "800" },
});
