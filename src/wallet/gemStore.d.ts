import type { GemEvent } from "./gemStore.native";
export declare const gemStore: {
  isSupported: boolean;
  subscribe(callback: (event: GemEvent) => void): () => void;
  fetchProduct(): Promise<{ displayPrice: string } | null>;
  buy(userId: string): Promise<void>;
};