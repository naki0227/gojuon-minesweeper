import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Pressable } from "../components/TapPressable";
import { useAdFree } from "../entitlements/useAdFree";
import { tr } from "../i18n";
import { colors } from "../theme/colors";
import { REWARDED_SUPPORTED, requestRewardedAd } from "./rewarded";

const S = tr({
  ja: {
    watch: "🎬 動画を見てヒント",
    free: "💡 ヒントを見る",
    what: "安全なマスを1つ光らせます",
    loading: "動画を準備中…",
    failed: "いまは動画を出せませんでした。少し待ってもう一度どうぞ。",
  },
  en: {
    watch: "🎬 Watch a video for a hint",
    free: "💡 Get a hint",
    what: "Lights up one safe cell",
    loading: "Getting the video…",
    failed: "No video right now. Try again in a moment.",
  },
});

// Opt-in hint for a rewarded ad. People who bought Remove Ads get the
// hint without one; where rewarded ads can't run (the web) it is hidden.
export function RewardHintButton({
  onReward,
  note,
}: {
  onReward: () => void;
  // Extra line under the button, such as what a hint costs in stars.
  note?: string;
}) {
  const { resolved, adFree } = useAdFree();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!resolved || (!adFree && !REWARDED_SUPPORTED)) return null;

  async function press() {
    if (adFree) {
      onReward();
      return;
    }
    setBusy(true);
    setFailed(false);
    const earned = await requestRewardedAd().catch(() => false);
    setBusy(false);
    if (earned) onReward();
    else setFailed(true);
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void press()}
        style={[styles.button, busy && styles.busy]}
      >
        <Text style={styles.label}>
          {busy ? S.loading : adFree ? S.free : S.watch}
        </Text>
      </Pressable>
      <Text style={styles.note}>
        {failed ? S.failed : note ? `${S.what}（${note}）` : S.what}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 4 },
  button: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  busy: { opacity: 0.6 },
  label: { color: colors.inkSoft, fontSize: 15, fontWeight: "800" },
  note: { color: colors.muted, fontSize: 12, textAlign: "center" },
});
