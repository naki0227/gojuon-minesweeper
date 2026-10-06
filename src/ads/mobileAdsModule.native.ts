import Constants, { ExecutionEnvironment } from "expo-constants";

export type MobileAdsModule = typeof import("react-native-google-mobile-ads");

// The Google Mobile Ads SDK is a native module that Expo Go does not contain.
// Load it lazily so Expo Go (and any build without it) simply shows no ads.
function loadMobileAds(): MobileAdsModule | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }

  try {
    // Expo Go has no native ads module, so this must be loaded at runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-google-mobile-ads") as MobileAdsModule;
  } catch {
    return null;
  }
}

export const mobileAds = loadMobileAds();
