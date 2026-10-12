import Constants, { ExecutionEnvironment } from "expo-constants";
import { currentAppleAccount, GEMS_PRODUCT_ID, verifyGemPurchase } from "./client";

type ExpoIap = typeof import("expo-iap");
type Purchase = import("expo-iap").Purchase;

export type GemEvent =
  | { type: "credited"; balance: number }
  | { type: "pending" }
  | { type: "error"; message: string };

function loadIap(): ExpoIap | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-iap") as ExpoIap;
  } catch {
    return null;
  }
}
const iap = loadIap();
const listeners = new Set<(event: GemEvent) => void>();
function emit(event: GemEvent) {
  listeners.forEach((listener) => listener(event));
}

// Called by the app-wide IAP listener. StoreKit transaction is *not*
// finished until the Apple server confirms it and Supabase commits the credit.
export async function handleGemPurchase(purchase: Purchase): Promise<void> {
  if (!iap || purchase.productId !== GEMS_PRODUCT_ID) return;
  if (purchase.purchaseState !== "purchased") {
    emit({ type: "pending" });
    return;
  }
  try {
    const owner = await currentAppleAccount();
    if (!owner) throw new Error("購入時のAppleアカウントでログインしてください。");
    const balance = await verifyGemPurchase(purchase.id);
    await iap.finishTransaction({ purchase, isConsumable: true });
    emit({ type: "credited", balance });
  } catch (error) {
    // Keep unfinished purchases for retry. The ledger is idempotent.
    emit({
      type: "error",
      message: error instanceof Error ? error.message : "購入を確認できませんでした。",
    });
  }
}

export const gemStore = {
  isSupported: iap !== null,
  subscribe(callback: (event: GemEvent) => void) {
    listeners.add(callback);
    return () => { listeners.delete(callback); };
  },
  async fetchProduct(): Promise<{ displayPrice: string } | null> {
    if (!iap) return null;
    const products = await iap.fetchProducts({
      skus: [GEMS_PRODUCT_ID], type: "in-app",
    });
    const result = products?.find((product) => product.id === GEMS_PRODUCT_ID);
    return result ? { displayPrice: result.displayPrice } : null;
  },
  async buy(userId: string): Promise<void> {
    if (!iap) throw new Error("この端末では購入できません。");
    if (userId !== await currentAppleAccount()) {
      throw new Error("Appleアカウントでログインしてください。");
    }
    await iap.requestPurchase({
      request: { apple: { sku: GEMS_PRODUCT_ID, appAccountToken: userId } },
      type: "in-app",
    });
  },
};