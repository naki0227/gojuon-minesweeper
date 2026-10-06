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

// Google's SKAdNetwork IDs plus the third-party buyers Google lists, copied
// from https://developers.google.com/admob/ios/3p-skadnetworks
// (page last updated 2026-01-30). Refresh from that page periodically.
const SK_AD_NETWORK_ITEMS = [
  "cstr6suwn9.skadnetwork",
  "4fzdc2evr5.skadnetwork",
  "2fnua5tdw4.skadnetwork",
  "ydx93a7ass.skadnetwork",
  "p78axxw29g.skadnetwork",
  "v72qych5uu.skadnetwork",
  "ludvb6z3bs.skadnetwork",
  "cp8zw746q7.skadnetwork",
  "3sh42y64q3.skadnetwork",
  "c6k4g5qg8m.skadnetwork",
  "s39g8k73mm.skadnetwork",
  "wg4vff78zm.skadnetwork",
  "3qy4746246.skadnetwork",
  "f38h382jlk.skadnetwork",
  "hs6bdukanm.skadnetwork",
  "mlmmfzh3r3.skadnetwork",
  "v4nxqhlyqp.skadnetwork",
  "wzmmz9fp6w.skadnetwork",
  "su67r6k2v3.skadnetwork",
  "yclnxrl5pm.skadnetwork",
  "t38b2kh725.skadnetwork",
  "7ug5zh24hu.skadnetwork",
  "gta9lk7p23.skadnetwork",
  "vutu7akeur.skadnetwork",
  "y5ghdn5j9k.skadnetwork",
  "v9wttpbfk9.skadnetwork",
  "n38lu8286q.skadnetwork",
  "47vhws6wlr.skadnetwork",
  "kbd757ywx3.skadnetwork",
  "9t245vhmpl.skadnetwork",
  "a2p9lx4jpn.skadnetwork",
  "22mmun2rn5.skadnetwork",
  "44jx6755aq.skadnetwork",
  "k674qkevps.skadnetwork",
  "4468km3ulz.skadnetwork",
  "2u9pt9hc89.skadnetwork",
  "8s468mfl3y.skadnetwork",
  "klf5c3l5u5.skadnetwork",
  "ppxm28t8ap.skadnetwork",
  "kbmxgpxpgc.skadnetwork",
  "uw77j35x4d.skadnetwork",
  "578prtvx9j.skadnetwork",
  "4dzt52r2t5.skadnetwork",
  "tl55sbb4fm.skadnetwork",
  "c3frkrj4fj.skadnetwork",
  "e5fvkxwrpn.skadnetwork",
  "8c4e2ghe7u.skadnetwork",
  "3rd42ekr43.skadnetwork",
  "97r2b46745.skadnetwork",
  "3qcr597p9d.skadnetwork",
];

// Production = an EAS build/update with the "production" profile, or an
// explicit APP_ENV=production (set in eas.json for the production profile).
const isProduction =
  process.env.APP_ENV === "production" ||
  process.env.EAS_BUILD_PROFILE === "production";
const targetPlatform =
  process.env.APP_TARGET_PLATFORM ?? process.env.EAS_BUILD_PLATFORM;

function resolveAdMobAppId(
  envName: "ADMOB_IOS_APP_ID" | "ADMOB_ANDROID_APP_ID",
  sampleId: string,
  platform: "ios" | "android",
): string {
  const value = process.env[envName]?.trim();

  if (isProduction && (!targetPlatform || targetPlatform === platform)) {
    if (!value || value.startsWith(GOOGLE_SAMPLE_PUBLISHER_PREFIX)) {
      throw new Error(
        `${envName} must be set to the real AdMob app ID for production builds.`,
      );
    }
    return value;
  }

  return value || sampleId;
}

// Production builds also need the banner unit ID for the platform being
// built; otherwise the build would succeed and silently show no ads.
function requireBannerUnitId(
  envName:
    "EXPO_PUBLIC_ADMOB_IOS_BANNER_ID" | "EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID",
  platform: "ios" | "android",
) {
  if (!isProduction || (targetPlatform && targetPlatform !== platform)) {
    return;
  }

  const value = process.env[envName]?.trim();
  if (!value || value.startsWith(GOOGLE_SAMPLE_PUBLISHER_PREFIX)) {
    throw new Error(
      `${envName} must be set to the real AdMob banner unit ID for production builds.`,
    );
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosAppId = resolveAdMobAppId(
    "ADMOB_IOS_APP_ID",
    GOOGLE_SAMPLE_IOS_APP_ID,
    "ios",
  );
  const androidAppId = resolveAdMobAppId(
    "ADMOB_ANDROID_APP_ID",
    GOOGLE_SAMPLE_ANDROID_APP_ID,
    "android",
  );
  requireBannerUnitId("EXPO_PUBLIC_ADMOB_IOS_BANNER_ID", "ios");
  requireBannerUnitId("EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID", "android");

  return {
    ...(config as ExpoConfig),
    plugins: [
      ...(config.plugins ?? []),
      [
        "react-native-google-mobile-ads",
        {
          iosAppId,
          androidAppId,
          skAdNetworkItems: SK_AD_NETWORK_ITEMS,
        },
      ],
      "expo-iap",
      [
        "expo-build-properties",
        {
          android: {
            // Keeps Google's UMP consent SDK classes in release builds, as
            // react-native-google-mobile-ads' consent guide requires.
            extraProguardRules:
              "-keep class com.google.android.gms.internal.consent_sdk.** { *; }",
          },
        },
      ],
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
