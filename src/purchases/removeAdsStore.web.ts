import type { RemoveAdsStore } from "./types";

// There is no account system yet, so an iOS purchase is not shared with the
// web. The web always reports "not owned" until a cross-platform entitlement
// source (e.g. Supabase) is added in src/entitlements.
export const removeAdsStore: RemoveAdsStore = {
  isSupported: false,
  canRedeemCode: false,
  connect: async () => {},
  disconnect: async () => {},
  fetchProduct: async () => null,
  ownsRemoveAds: async () => false,
  purchase: async () => {},
  restore: async () => false,
  redeemCode: async () => {},
  subscribe: () => () => {},
};
