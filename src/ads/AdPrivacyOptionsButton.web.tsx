import { useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { getAdSenseUnit } from "./config";

type GoogleFundingChoices = {
  callbackQueue?: unknown[];
  showRevocationMessage?: () => void;
};

declare global {
  interface Window {
    googlefc?: GoogleFundingChoices;
  }
}

// Entry to the consent message of Google's certified CMP for AdSense
// (Privacy & messaging), so visitors can change or withdraw consent.
// Rendered only when AdSense is configured for this build.
export function AdPrivacyOptionsButton() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted || !getAdSenseUnit("setup")) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        const googlefc = (window.googlefc = window.googlefc || {});
        (googlefc.callbackQueue = googlefc.callbackQueue || []).push({
          CONSENT_API_READY: () => window.googlefc?.showRevocationMessage?.(),
        });
      }}
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
  text: { color: "#287da5", fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
