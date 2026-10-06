import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { isPrivacyOptionsRequired } from "./consent";
import { mobileAds } from "./mobileAdsModule";

// Persistent entry to Google's UMP privacy options form, so users can change
// or withdraw ad consent at any time. Rendered only where UMP says it is
// required; elsewhere (and in Expo Go) it renders nothing.
export function AdPrivacyOptionsButton() {
  const [required, setRequired] = useState(false);

  useEffect(() => {
    if (!mobileAds) {
      return;
    }

    const { AdsConsent } = mobileAds;
    let active = true;

    (async () => {
      try {
        let info = await AdsConsent.getConsentInfo();
        if (info.privacyOptionsRequirementStatus === "UNKNOWN") {
          info = await AdsConsent.requestInfoUpdate();
        }
        if (active) {
          setRequired(
            isPrivacyOptionsRequired(info.privacyOptionsRequirementStatus),
          );
        }
      } catch {
        // No consent information available; nothing to change.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!mobileAds || !required) {
    return null;
  }

  const { AdsConsent } = mobileAds;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void AdsConsent.showPrivacyOptionsForm().catch(() => {});
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
