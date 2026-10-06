import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import { REMOVE_ADS_PRODUCT_ID } from "./products";
import type {
  RemoveAdsProduct,
  RemoveAdsStore,
  RemoveAdsStoreEvent,
} from "./types";

type ExpoIap = typeof import("expo-iap");
type Purchase = import("expo-iap").Purchase;

// expo-iap is a native module that Expo Go does not contain, so it is loaded
// lazily and the store is reported as unsupported when it is missing.
function loadExpoIap(): ExpoIap | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }

  try {
    // Expo Go has no native purchase module, so this must be loaded at runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-iap") as ExpoIap;
  } catch {
    return null;
  }
}

const iap = loadExpoIap();
const listeners = new Set<(event: RemoveAdsStoreEvent) => void>();
let nativeSubscriptions: { remove: () => void }[] = [];

function emit(event: RemoveAdsStoreEvent) {
  listeners.forEach((listener) => listener(event));
}

function isRemoveAds(purchase: Purchase): boolean {
  return (
    purchase.productId === REMOVE_ADS_PRODUCT_ID &&
    purchase.purchaseState === "purchased"
  );
}

async function handlePurchase(purchase: Purchase) {
  if (!iap || purchase.productId !== REMOVE_ADS_PRODUCT_ID) {
    return;
  }

  if (purchase.purchaseState !== "purchased") {
    emit({ type: "pending" });
    return;
  }

  try {
    await iap.finishTransaction({ purchase, isConsumable: false });
  } catch {
    // The entitlement is still valid; StoreKit replays unfinished
    // transactions on the next launch.
  }

  emit({ type: "owned" });
}

async function ownsRemoveAds(): Promise<boolean> {
  if (!iap) {
    return false;
  }

  const purchases = await iap.getAvailablePurchases({
    onlyIncludeActiveItemsIOS: true,
  });

  return purchases.some(isRemoveAds);
}

export const removeAdsStore: RemoveAdsStore = {
  isSupported: iap !== null,
  // TODO(android): Play Console promo codes are not set up yet. Keep the
  // "use a code" entry iOS-only until they are; do not build a custom code DB.
  canRedeemCode: iap !== null && Platform.OS === "ios",

  async connect() {
    if (!iap) {
      return;
    }

    await iap.initConnection();

    nativeSubscriptions.forEach((subscription) => subscription.remove());
    nativeSubscriptions = [
      iap.purchaseUpdatedListener((purchase) => {
        void handlePurchase(purchase);
      }),
      iap.purchaseErrorListener((error) => {
        emit({
          type: "error",
          message: error.message,
          cancelled: error.code === iap.ErrorCode.UserCancelled,
        });
      }),
    ];
  },

  async disconnect() {
    nativeSubscriptions.forEach((subscription) => subscription.remove());
    nativeSubscriptions = [];
    await iap?.endConnection();
  },

  async fetchProduct(): Promise<RemoveAdsProduct | null> {
    if (!iap) {
      return null;
    }

    const products = await iap.fetchProducts({
      skus: [REMOVE_ADS_PRODUCT_ID],
      type: "in-app",
    });
    const product = products?.find((item) => item.id === REMOVE_ADS_PRODUCT_ID);

    return product
      ? {
          id: product.id,
          title: product.title,
          displayPrice: product.displayPrice,
        }
      : null;
  },

  ownsRemoveAds,

  async purchase() {
    if (!iap) {
      return;
    }

    await iap.requestPurchase({
      type: "in-app",
      request: {
        apple: { sku: REMOVE_ADS_PRODUCT_ID },
        google: { skus: [REMOVE_ADS_PRODUCT_ID] },
      },
    });
  },

  async restore() {
    if (!iap) {
      return false;
    }

    await iap.restorePurchases();
    return ownsRemoveAds();
  },

  async redeemCode() {
    if (!iap || Platform.OS !== "ios") {
      return;
    }

    // Apple's own offer-code sheet. A redeemed code arrives as a normal
    // transaction through purchaseUpdatedListener; the provider also
    // re-checks entitlements when the app returns to the foreground.
    const purchase = await iap.openRedeemOfferCode();
    if (purchase) {
      await handlePurchase(purchase);
    }
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
