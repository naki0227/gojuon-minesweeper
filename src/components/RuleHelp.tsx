import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { SoundButton } from "../sound/SoundButton";
import { TutorialModal } from "../tutorial/TutorialModal";
import { colors } from "../theme/colors";
import { Pressable } from "./TapPressable";

// A small "ルール" link that opens the animated tutorial, on every
// platform, so the match stays on one screen; next to it the sound settings.
export function RuleHelp() {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.row}>
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
      <SoundButton />
      <TutorialModal visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
  },
  label: { color: colors.help, fontSize: 12, fontWeight: "800" },
});
