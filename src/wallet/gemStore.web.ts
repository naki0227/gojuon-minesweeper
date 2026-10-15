import { tr } from "../i18n";
import type { GemEvent, GemProduct } from "./gemStore.native";

const S = tr({
  ja: { iosOnly: "ジェム購入はiOSのみ対応しています。" },
  en: { iosOnly: "Gems can only be bought on iOS." },
});

export const gemStore = {
  isSupported: false,
  subscribe(_callback: (event: GemEvent) => void) {
    return () => {};
  },
  async fetchProducts(): Promise<GemProduct[]> {
    return [];
  },
  async buy(_userId: string, _productId: string): Promise<void> {
    throw new Error(S.iosOnly);
  },
};
