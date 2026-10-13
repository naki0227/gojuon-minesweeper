// Gem packs sold as iOS consumables. The server has its own copy of the
// product → gems mapping and never trusts the client's. Discounts are
// against the 10-gem pack's ¥20 per gem, using the Japanese prices.
export type GemPack = {
  productId: string;
  gems: number;
  priceYen: number;
};

export const GEM_PACKS: readonly GemPack[] = [
  {
    productId: "com.naki0227.gojuonminesweeper.gems10",
    gems: 10,
    priceYen: 200,
  },
  {
    productId: "com.naki0227.gojuonminesweeper.gems30",
    gems: 30,
    priceYen: 500,
  },
  {
    productId: "com.naki0227.gojuonminesweeper.gems70",
    gems: 70,
    priceYen: 1000,
  },
];

const BASE_YEN_PER_GEM = 20;

export function isGemProduct(productId: string): boolean {
  return GEM_PACKS.some((pack) => pack.productId === productId);
}

// Rounded discount in percent, 0 for the base pack.
export function packDiscountPercent(pack: GemPack): number {
  return Math.round((1 - pack.priceYen / (pack.gems * BASE_YEN_PER_GEM)) * 100);
}
