import type { MobileAdsModule } from "./mobileAdsModule";

let started: Promise<void> | null = null;

// Starts the AdMob SDK once, limited to ads rated "G" (general audiences,
// including families and children): no dating, gambling, alcohol and
// similar ads in a word game for all ages. Sensitive categories can be
// blocked further in the AdMob console.
export function startAds(sdk: MobileAdsModule): Promise<void> {
  if (!started) {
    started = (async () => {
      await sdk.default().setRequestConfiguration({
        maxAdContentRating: sdk.MaxAdContentRating.G,
      });
      await sdk.default().initialize();
    })();
    // Let a later call try again if the SDK failed to start.
    started.catch(() => {
      started = null;
    });
  }
  return started;
}
