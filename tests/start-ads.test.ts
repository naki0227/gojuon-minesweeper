import { describe, expect, it, vi } from "vitest";

import type { MobileAdsModule } from "../src/ads/mobileAdsModule";
import { startAds } from "../src/ads/startAds";

describe("startAds", () => {
  it("limits ads to general audiences before starting the SDK, once", async () => {
    const calls: string[] = [];
    const instance = {
      setRequestConfiguration: vi.fn(async (config: unknown) => {
        calls.push(`config:${JSON.stringify(config)}`);
      }),
      initialize: vi.fn(async () => {
        calls.push("initialize");
      }),
    };
    const sdk = {
      default: () => instance,
      MaxAdContentRating: { G: "G" },
    } as unknown as MobileAdsModule;

    await startAds(sdk);
    await startAds(sdk);

    expect(calls).toEqual(['config:{"maxAdContentRating":"G"}', "initialize"]);
  });
});
