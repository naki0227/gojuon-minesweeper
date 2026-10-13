import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const RULE =
  "回答してから1文字開く。セーフなら周囲8マスの答え文字数（重複込み）を表示。0なら安全地帯が連鎖して開きます。地雷なら次の自分のターンは回答権なし。";

const LEGEND =
  "白いマス：セーフ（数字は周囲の答え文字数）／オレンジのマス：地雷";

// The rules and the board legend take several lines, so they open on
// demand under the prompt.
export function RuleHelp({ kana = false }: { kana?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? "ルールを閉じる" : "ルールを見る"}
        onPress={() => setOpen((value) => !value)}
        hitSlop={8}
        style={styles.button}
      >
        <MaterialIcons name="help-outline" size={16} color="#4285a8" />
        <Text style={styles.label}>ルール</Text>
      </Pressable>
      {open ? (
        <Text style={styles.rule}>
          {RULE}
          {"\n"}
          {LEGEND}
          {kana ? "。「ー」は「ん」の下" : ""}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
  },
  label: { color: "#4285a8", fontSize: 12, fontWeight: "800" },
  rule: { color: "#627481", fontSize: 13, lineHeight: 20 },
});
