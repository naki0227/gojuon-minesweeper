import { Platform } from "react-native";

import { AD_REQUEST_OPTIONS, shouldUseTestAds } from "../ads/config";
import { canRequestAds } from "../ads/consent";
import { mobileAds } from "../ads/mobileAdsModule";
import { startAds } from "../ads/startAds";

// No rewards without actually earning them from the native SDK.
// Web uses an explicitly labelled free-preview revival until a web reward
// mechanism is independently reviewed and implemented.
export async function requestRewardedRevive(): Promise<boolean> {
  const sdk = mobileAds;
  if (!sdk || !(await canRequestAds(sdk.AdsConsent))) return false;

  const productionId =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID
      : process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID;
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
