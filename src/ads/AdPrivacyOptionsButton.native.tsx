import { useEffect, useState } from "react";

import { isPrivacyOptionsRequired } from "./consent";
import { mobileAds } from "./mobileAdsModule";
import { PrivacyOptionsLink } from "./PrivacyOptionsLink";

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
    <PrivacyOptionsLink
      onPress={() => {
        void AdsConsent.showPrivacyOptionsForm().catch(() => {});
      }}
    />
  );
}
