import { useSyncExternalStore } from "react";

import { getAdSenseUnit } from "./config";
import { PrivacyOptionsLink } from "./PrivacyOptionsLink";

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
    <PrivacyOptionsLink
      onPress={() => {
        const googlefc = (window.googlefc = window.googlefc || {});
        (googlefc.callbackQueue = googlefc.callbackQueue || []).push({
          CONSENT_API_READY: () => window.googlefc?.showRevocationMessage?.(),
        });
      }}
    />
  );
}
