import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { RULE_STEPS } from "../tutorial/rules";
import { TutorialModal } from "../tutorial/TutorialModal";
import { colors } from "../theme/colors";

const LEGEND =
  "白いマス：セーフ（数字は周囲の答え文字数）／オレンジのマス：地雷";

// Web has room for the rules as text. The apps keep the match on one
// screen and open the animated tutorial from a small link instead.
export function RuleHelp({ kana = false }: { kana?: boolean }) {
  const [open, setOpen] = useState(false);
  if (Platform.OS === "web") {
    return (
      <Text style={styles.rule}>
        {RULE_STEPS.map((step) => step.body).join("")}
        {"\n"}
        {LEGEND}
        {kana ? "。「ー」は「ん」の下" : ""}
      </Text>
    );
  }
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
  rule: { color: "#627481", fontSize: 13, lineHeight: 20 },
});
