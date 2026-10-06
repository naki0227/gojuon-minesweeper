import type { ConfigContext, ExpoConfig } from "expo/config";

// app.json stays the source of truth for the static app settings
// (EAS projectId, owner, bundle IDs, version, icon, web, plugins ...).
// This file only layers the ad / IAP settings on top of it, so nothing in
// app.json is dropped.

// Google's official sample AdMob app IDs. They are only used for local and
// internal builds; production builds refuse them (see resolveAdMobAppId).
// https://developers.google.com/admob/ios/test-ads
// https://developers.google.com/admob/android/test-ads
const GOOGLE_SAMPLE_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";
const GOOGLE_SAMPLE_ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";
const GOOGLE_SAMPLE_PUBLISHER_PREFIX = "ca-app-pub-3940256099942544";

// Production = an EAS build/update with the "production" profile, or an
// explicit APP_ENV=production (set in eas.json for the production profile).
const isProduction =
  process.env.APP_ENV === "production" ||
  process.env.EAS_BUILD_PROFILE === "production";

function resolveAdMobAppId(
  envName: "ADMOB_IOS_APP_ID" | "ADMOB_ANDROID_APP_ID",
  sampleId: string,
): string {
  const value = process.env[envName]?.trim();

  if (isProduction) {
    if (!value || value.startsWith(GOOGLE_SAMPLE_PUBLISHER_PREFIX)) {
      throw new Error(
        `${envName} must be set to the real AdMob app ID for production builds.`,
      );
    }
    return value;
  }

  return value || sampleId;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosAppId = resolveAdMobAppId(
    "ADMOB_IOS_APP_ID",
    GOOGLE_SAMPLE_IOS_APP_ID,
  );
  const androidAppId = resolveAdMobAppId(
    "ADMOB_ANDROID_APP_ID",
    GOOGLE_SAMPLE_ANDROID_APP_ID,
  );

  return {
    ...(config as ExpoConfig),
    plugins: [
      ...(config.plugins ?? []),
      [
        "react-native-google-mobile-ads",
        {
          iosAppId,
          androidAppId,
          // Google's SKAdNetwork ID. Add partner IDs here if mediation is
          // introduced later.
          skAdNetworkItems: ["cstr6suwn9.skadnetwork"],
        },
      ],
      "expo-iap",
    ],
    extra: {
      ...config.extra,
      ads: {
        // Native banners use Google's test unit IDs only when this is true.
        // It is always false for production builds.
        useTestIds: !isProduction,
      },
    },
  };
};
