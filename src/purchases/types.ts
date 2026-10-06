export type RemoveAdsProduct = {
  id: string;
  title: string;
  // Localized price string from StoreKit / Play Billing. Never hardcoded.
  displayPrice: string;
};

export type RemoveAdsStoreEvent =
  | { type: "owned" }
  // e.g. Ask to Buy / deferred payment: approved later, delivered as "owned".
  | { type: "pending" }
  | { type: "error"; message: string; cancelled: boolean };

// Platform store for the remove-ads non-consumable.
// Native: expo-iap (StoreKit 2 / Play Billing). Web: unsupported stub.
export type RemoveAdsStore = {
  // False on web and in Expo Go, where no store is reachable.
  isSupported: boolean;
  // True where the platform's official offer-code redemption flow exists
  // (iOS only for now).
  canRedeemCode: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchProduct(): Promise<RemoveAdsProduct | null>;
  // Whether the store currently reports the remove-ads entitlement.
  ownsRemoveAds(): Promise<boolean>;
  // Starts the purchase sheet; the outcome arrives through subscribe().
  purchase(): Promise<void>;
  // Re-syncs with the store and returns whether the entitlement exists.
  restore(): Promise<boolean>;
  // Opens the platform's official code redemption sheet. The code itself is
  // never seen or checked by the app.
  redeemCode(): Promise<void>;
  subscribe(listener: (event: RemoveAdsStoreEvent) => void): () => void;
};
