import { describe, expect, it } from "vitest";

import { isPrivacyOptionsRequired } from "../src/ads/consent";
import { supportsInAppOfferCodes } from "../src/purchases/offerCodes";

describe("in-app offer code redemption", () => {
  it("is available on iOS 16.3 and later only", () => {
    expect(supportsInAppOfferCodes("ios", "16.3")).toBe(true);
    expect(supportsInAppOfferCodes("ios", "17.0")).toBe(true);
    expect(supportsInAppOfferCodes("ios", "26.5")).toBe(true);
    expect(supportsInAppOfferCodes("ios", "16.2")).toBe(false);
    expect(supportsInAppOfferCodes("ios", "15.8.3")).toBe(false);
  });

  it("is not offered on Android or the web", () => {
    expect(supportsInAppOfferCodes("android", 35)).toBe(false);
    expect(supportsInAppOfferCodes("web", "")).toBe(false);
  });
});

describe("ad privacy options entry", () => {
  it("is shown only when UMP says it is required", () => {
    expect(isPrivacyOptionsRequired("REQUIRED")).toBe(true);
    expect(isPrivacyOptionsRequired("NOT_REQUIRED")).toBe(false);
    expect(isPrivacyOptionsRequired("UNKNOWN")).toBe(false);
    expect(isPrivacyOptionsRequired(undefined)).toBe(false);
  });
});
