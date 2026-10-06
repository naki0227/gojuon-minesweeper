import Constants from "expo-constants";
import { Platform } from "react-native";

import type { AdPlacement } from "./types";

// Every ID comes from the environment; nothing real is committed.
// EXPO_PUBLIC_* values are inlined at bundle time, so they must be read
// with literal `process.env.NAME` access.
const env = {
  iosBannerId: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID,
  androidBannerId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
  adsenseClientId: process.env.EXPO_PUBLIC_ADSENSE_CLIENT_ID,
  adsenseSetupSlotId: process.env.EXPO_PUBLIC_ADSENSE_SETUP_SLOT_ID,
  adsenseResultSlotId: process.env.EXPO_PUBLIC_ADSENSE_RESULT_SLOT_ID,
};

const GOOGLE_SAMPLE_PUBLISHER_PREFIX = "ca-app-pub-3940256099942544";

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// Set by app.config.ts: true for dev / preview builds, always false for
// production builds, so a production binary can never request test ads.
export function shouldUseTestAds(): boolean {
  const extra = Constants.expoConfig?.extra as
    | { ads?: { useTestIds?: boolean } }
    | undefined;

  return extra?.ads?.useTestIds === true;
}

// Returns the real AdMob banner unit ID for this platform, or null when it
// is not configured (or is accidentally one of Google's sample IDs).
export function getAdMobBannerUnitId(): string | null {
  const id = clean(
    Platform.OS === "ios" ? env.iosBannerId : env.androidBannerId,
  );

  if (!id || id.startsWith(GOOGLE_SAMPLE_PUBLISHER_PREFIX)) {
    return null;
  }

  return id;
}

export type AdSenseUnit = {
  clientId: string;
  slotId: string;
};

// Returns the AdSense unit for a placement, or null when it is not configured.
export function getAdSenseUnit(placement: AdPlacement): AdSenseUnit | null {
  const clientId = clean(env.adsenseClientId);
  const slotId = clean(
    placement === "setup" ? env.adsenseSetupSlotId : env.adsenseResultSlotId,
  );

  if (!clientId || !slotId) {
    return null;
  }

  return { clientId, slotId };
}
