import type { GemEvent, GemProduct } from "./gemStore.native";

export const gemStore = {
  isSupported: false,
  subscribe(_callback: (event: GemEvent) => void) {
    return () => {};
  },
  async fetchProducts(): Promise<GemProduct[]> {
    return [];
  },
  async buy(_userId: string, _productId: string): Promise<void> {
    throw new Error("ジェム購入はiOSのみ対応しています。");
  },
};
