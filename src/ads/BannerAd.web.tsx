import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useAdFree } from "../entitlements/useAdFree";
import { getAdSenseUnit, type AdSenseUnit } from "./config";
import type { BannerAdProps } from "./types";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const SCRIPT_ID = "adsbygoogle-js";

// Loads the AdSense script on demand (not in <head>) so it is only fetched on
// screens that actually show an ad. Auto Ads are not enabled anywhere: units
// render only where <BannerAd /> is placed.
function ensureAdSenseScript(clientId: string) {
  if (document.getElementById(SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  document.head.appendChild(script);
}

function AdSenseUnitView({ unit }: { unit: AdSenseUnit }) {
  const insRef = useRef<HTMLModElement | null>(null);
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) {
      return;
    }

    ensureAdSenseScript(unit.clientId);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      setUnfilled(true);
      return;
    }

    // AdSense marks units it cannot fill with data-ad-status="unfilled".
    // Collapse them instead of leaving an empty box.
    const observer = new MutationObserver(() => {
      if (ins.getAttribute("data-ad-status") === "unfilled") {
        setUnfilled(true);
      }
    });
    observer.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });

    return () => observer.disconnect();
  }, [unit.clientId, unit.slotId]);

  if (unfilled) {
    return null;
  }

  // Responsive display ad unit. The ins is 0px tall until AdSense fills it,
  // and the label/markup inside comes from AdSense unchanged.
  return (
    <View style={styles.container}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={unit.clientId}
        data-ad-slot={unit.slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
        {...(__DEV__ ? { "data-adtest": "on" } : null)}
      />
    </View>
  );
}

export function BannerAd({ placement }: BannerAdProps) {
  const { resolved, adFree } = useAdFree();
  // Static export renders on the server first; ad markup is client-only.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unit = getAdSenseUnit(placement);

  if (!mounted || !resolved || adFree || !unit) {
    return null;
  }

  return <AdSenseUnitView key={placement} unit={unit} />;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
