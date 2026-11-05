import { Platform } from "react-native";

import { AD_REQUEST_OPTIONS, shouldUseTestAds } from "./config";
import { canRequestAds } from "./consent";
import { mobileAds } from "./mobileAdsModule";
import { startAds } from "./startAds";

const productionId =
  Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID
    : process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID;

// The SDK is in this build, and there is a real unit (or test ads).
export const REWARDED_SUPPORTED =
  mobileAds !== null && (shouldUseTestAds() || !!productionId);

// No rewards without actually earning them from the native SDK.
export async function requestRewardedAd(): Promise<boolean> {
  const sdk = mobileAds;
  if (!sdk || !(await canRequestAds(sdk.AdsConsent))) return false;

  const unitId = shouldUseTestAds() ? sdk.TestIds.REWARDED : productionId;
  if (!unitId || unitId.startsWith("ca-app-pub-3940256099942544")) {
    // Production must never request an example ad.
    if (!shouldUseTestAds()) return false;
  }
  await startAds(sdk);

  return new Promise<boolean>((resolve) => {
    const ad = sdk.RewardedAd.createForAdRequest(unitId!, AD_REQUEST_OPTIONS);
    const unsubscribers: Array<() => void> = [];
    let earned = false;
    let finished = false;
    function finish(granted: boolean) {
      if (finished) return;
      finished = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      resolve(granted);
    }
    unsubscribers.push(
      ad.addAdEventListener(sdk.RewardedAdEventType.LOADED, () => {
        void ad.show().catch(() => finish(false));
      }),
      ad.addAdEventListener(sdk.RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(sdk.AdEventType.CLOSED, () => finish(earned)),
      ad.addAdEventListener(sdk.AdEventType.ERROR, () => finish(false)),
    );
    ad.load();
  });
}
