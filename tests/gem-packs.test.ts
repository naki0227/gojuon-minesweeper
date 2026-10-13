import { describe, expect, it } from "vitest";

import {
  GEM_PACKS,
  isGemProduct,
  packDiscountPercent,
} from "../src/wallet/packs";

describe("gem packs", () => {
  it("discounts larger packs against ¥20 per gem", () => {
    expect(
      GEM_PACKS.map((pack) => [pack.gems, packDiscountPercent(pack)]),
    ).toEqual([
      [10, 0],
      [30, 17],
      [70, 29],
    ]);
  });

  it("recognizes only the sold product IDs", () => {
    expect(isGemProduct("com.naki0227.gojuonminesweeper.gems30")).toBe(true);
    expect(isGemProduct("com.naki0227.gojuonminesweeper.removeads")).toBe(
      false,
    );
  });
});
