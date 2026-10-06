import { describe, expect, it } from "vitest";

import { selectBannerUnitId } from "../src/ads/selectBannerUnitId";
import { canRequestAds } from "../src/ads/consent";
import { isOwnershipResolved } from "../src/entitlements/adAccess";

describe("native ad access", () => {
  it("keeps ads hidden while purchase ownership is unknown", () => {
    expect(isOwnershipResolved("checking", "ios")).toBe(false);
    expect(isOwnershipResolved("unavailable", "ios")).toBe(false);
    expect(isOwnershipResolved("unavailable", "android")).toBe(false);
    expect(isOwnershipResolved("ready", "ios")).toBe(true);
  });

  it("allows web ads when no native store exists", () => {
    expect(isOwnershipResolved("unavailable", "web")).toBe(true);
  });

  it("always uses a test banner ID in nonproduction builds", () => {
    expect(selectBannerUnitId(true, "real-id", "test-id")).toBe("test-id");
    expect(selectBannerUnitId(false, "real-id", "test-id")).toBe("real-id");
    expect(selectBannerUnitId(false, null, "test-id")).toBeNull();
  });

  it("requests ads only when consent status permits it", async () => {
    expect(
      await canRequestAds({
        gatherConsent: async () => ({ canRequestAds: false }),
        getConsentInfo: async () => ({ canRequestAds: true }),
      }),
    ).toBe(false);

    expect(
      await canRequestAds({
        gatherConsent: async () => {
          throw new Error("UMP unavailable");
        },
        getConsentInfo: async () => ({ canRequestAds: true }),
      }),
    ).toBe(true);

    expect(
      await canRequestAds({
        gatherConsent: async () => {
          throw new Error("UMP unavailable");
        },
        getConsentInfo: async () => {
          throw new Error("No cached status");
        },
      }),
    ).toBe(false);
  });
});
