import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useAdFree } from "../entitlements/useAdFree";
import {
  AD_REQUEST_OPTIONS,
  getAdMobBannerUnitId,
  shouldUseTestAds,
} from "./config";
import { canRequestAds } from "./consent";
import { mobileAds, type MobileAdsModule } from "./mobileAdsModule";
import { selectBannerUnitId } from "./selectBannerUnitId";
import type { BannerAdProps } from "./types";

let initialization: Promise<boolean> | null = null;

// Gathers consent (UMP; only shows a form where the law requires it) and
// initializes the SDK once per app launch.
function initializeAds(sdk: MobileAdsModule): Promise<boolean> {
  if (!initialization) {
    initialization = (async () => {
      if (!(await canRequestAds(sdk.AdsConsent))) {
        return false;
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
  return selectBannerUnitId(
    shouldUseTestAds(),
    getAdMobBannerUnitId(),
    sdk.TestIds.ADAPTIVE_BANNER,
  );
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
        requestOptions={AD_REQUEST_OPTIONS}
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
