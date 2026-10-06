import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useAdFree } from "../entitlements/useAdFree";
import { getAdMobBannerUnitId, shouldUseTestAds } from "./config";
import type { BannerAdProps } from "./types";

type MobileAdsModule = typeof import("react-native-google-mobile-ads");

// The Google Mobile Ads SDK is a native module that Expo Go does not contain.
// Load it lazily so Expo Go (and any build without it) simply shows no ads.
function loadMobileAds(): MobileAdsModule | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }

  try {
    return require("react-native-google-mobile-ads") as MobileAdsModule;
  } catch {
    return null;
  }
}

const mobileAds = loadMobileAds();
let initialization: Promise<boolean> | null = null;

// Gathers consent (UMP; only shows a form where the law requires it) and
// initializes the SDK once per app launch.
function initializeAds(sdk: MobileAdsModule): Promise<boolean> {
  if (!initialization) {
    initialization = (async () => {
      try {
        const consent = await sdk.AdsConsent.gatherConsent();
        if (!consent.canRequestAds) {
          return false;
        }
      } catch {
        // Consent info could not be fetched (offline etc.). Ads may still be
        // requested; the SDK applies its own defaults.
      }

      try {
        await sdk.default().initialize();
        return true;
      } catch {
        return false;
      }
    })();
  }

  return initialization;
}

function resolveUnitId(sdk: MobileAdsModule): string | null {
  // Test unit IDs only in dev / preview builds. Production builds always
  // have useTestIds=false, so they fall through to the real ID or nothing.
  if (shouldUseTestAds()) {
    return getAdMobBannerUnitId() ?? sdk.TestIds.ADAPTIVE_BANNER;
  }

  return getAdMobBannerUnitId();
}

export function BannerAd({ placement }: BannerAdProps) {
  const { resolved, adFree } = useAdFree();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const showAds = mobileAds !== null && resolved && !adFree;

  useEffect(() => {
    if (!showAds || !mobileAds) {
      return;
    }

    let active = true;
    void initializeAds(mobileAds).then((ok) => {
      if (active) {
        setReady(ok);
      }
    });

    return () => {
      active = false;
    };
  }, [showAds]);

  if (!showAds || !mobileAds || !ready || failed) {
    return null;
  }

  const unitId = resolveUnitId(mobileAds);
  if (!unitId) {
    return null;
  }

  const { BannerAd: AdMobBanner, BannerAdSize } = mobileAds;

  // No fixed height: the container is 0px until an ad loads and collapses
  // again on failure, so no empty box or error UI is ever shown.
  return (
    <View style={styles.container} testID={`banner-ad-${placement}`}>
      <AdMobBanner
        unitId={unitId}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
  },
});
