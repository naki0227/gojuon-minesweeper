import type { GemEvent, GemProduct } from "./gemStore.native";
export declare const gemStore: {
  isSupported: boolean;
  subscribe(callback: (event: GemEvent) => void): () => void;
  fetchProducts(): Promise<GemProduct[]>;
  buy(userId: string, productId: string): Promise<void>;
};
