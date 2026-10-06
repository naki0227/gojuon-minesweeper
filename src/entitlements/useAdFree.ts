import { useRemoveAds } from "../purchases/RemoveAdsProvider";

export type AdFreeState = {
  // False while entitlement sources are still answering. Ads stay hidden
  // until this is true, so a buyer never sees an ad flash on launch.
  resolved: boolean;
  adFree: boolean;
};

// Single place that decides whether ads may be shown. UI must not read the
// purchase state directly.
//
// Sources today:
// - the platform store on this device (iOS StoreKit purchase / offer code).
//   Web has no store and therefore always shows ads.
//
// TODO(cross-platform): when accounts exist (e.g. Supabase), add a remote
// entitlement source here and OR it with the store result. Do not share the
// iOS purchase with the web until then.
export function useAdFree(): AdFreeState {
  const { status, owned } = useRemoveAds();

  return {
    resolved: status !== "checking",
    adFree: owned,
  };
}
