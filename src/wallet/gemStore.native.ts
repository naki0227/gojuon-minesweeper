import Constants, { ExecutionEnvironment } from "expo-constants";
import { currentAppleAccount, verifyGemPurchase } from "./client";
import { GEM_PACKS, isGemProduct, type GemPack } from "./packs";

export type GemProduct = GemPack & { displayPrice: string };

type ExpoIap = typeof import("expo-iap");
type Purchase = import("expo-iap").Purchase;

export type GemEvent =
  | { type: "credited"; balance: number }
  | { type: "pending" }
  | { type: "error"; message: string };

function loadIap(): ExpoIap | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
    return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-iap") as ExpoIap;
  } catch {
    return null;
  }
}
const iap = loadIap();
const listeners = new Set<(event: GemEvent) => void>();
let awaitingPurchase = false;
function emit(event: GemEvent) {
  listeners.forEach((listener) => listener(event));
}

// Called by the app-wide IAP listener. StoreKit transaction is *not*
// finished until the Apple server confirms it and Supabase commits the credit.
export async function handleGemPurchase(purchase: Purchase): Promise<void> {
  if (!iap || !isGemProduct(purchase.productId)) return;
  awaitingPurchase = false;
  if (purchase.purchaseState !== "purchased") {
    emit({ type: "pending" });
    return;
  }
  try {
    const owner = await currentAppleAccount();
    if (!owner)
      throw new Error("購入時のAppleアカウントでログインしてください。");
    const balance = await verifyGemPurchase(purchase.id);
    await iap.finishTransaction({ purchase, isConsumable: true });
    emit({ type: "credited", balance });
  } catch (error) {
    // Keep unfinished purchases for retry. The ledger is idempotent.
    emit({
      type: "error",
      message:
        error instanceof Error ? error.message : "購入を確認できませんでした。",
    });
  }
}

export function handleGemPurchaseError(message: string): boolean {
  if (!awaitingPurchase) return false;
  awaitingPurchase = false;
  emit({ type: "error", message });
  return true;
}

export const gemStore = {
  isSupported: iap !== null,
  subscribe(callback: (event: GemEvent) => void) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
  // Packs that StoreKit returned, in GEM_PACKS order. Missing ones (not yet
  // approved, or not sold in the storefront) are left out.
  async fetchProducts(): Promise<GemProduct[]> {
    if (!iap) return [];
    const products = await iap.fetchProducts({
      skus: GEM_PACKS.map((pack) => pack.productId),
      type: "in-app",
    });
    return GEM_PACKS.flatMap((pack) => {
      const found = products?.find((product) => product.id === pack.productId);
      return found ? [{ ...pack, displayPrice: found.displayPrice }] : [];
    });
  },
  async buy(userId: string, productId: string): Promise<void> {
    if (!isGemProduct(productId)) throw new Error("商品が見つかりません。");
    if (!iap) throw new Error("この端末では購入できません。");
    if (userId !== (await currentAppleAccount())) {
      throw new Error("Appleアカウントでログインしてください。");
    }
    awaitingPurchase = true;
    try {
      await iap.requestPurchase({
        request: { apple: { sku: productId, appAccountToken: userId } },
        type: "in-app",
      });
    } catch (error) {
      awaitingPurchase = false;
      throw error;
    }
  },
};
