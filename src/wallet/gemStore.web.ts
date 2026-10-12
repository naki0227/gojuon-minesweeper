import type { GemEvent } from "./gemStore.native";

export const gemStore = {
  isSupported: false,
  subscribe(_callback: (event: GemEvent) => void) { return () => {}; },
  async fetchProduct(): Promise<{ displayPrice: string } | null> { return null; },
  async buy(_userId: string): Promise<void> {
    throw new Error("ジェム購入はiOSのみ対応しています。");
  },
};