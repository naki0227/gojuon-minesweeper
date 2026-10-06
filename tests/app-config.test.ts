import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConfigContext } from "expo/config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function readConfig() {
  vi.resetModules();
  const { default: createConfig } = await import("../app.config");
  const context: ConfigContext = {
    projectRoot: process.cwd(),
    staticConfigPath: null,
    packageJsonPath: null,
    config: { name: "test", slug: "test" },
  };
  return createConfig(context);
}

async function readAdMobIds() {
  const config = await readConfig();
  const adMob = config.plugins?.find(
    (plugin) =>
      Array.isArray(plugin) && plugin[0] === "react-native-google-mobile-ads",
  );
  return Array.isArray(adMob) ? adMob[1] : null;
}

describe("production AdMob app IDs", () => {
  it("allows an iOS build before an Android app ID exists", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("APP_TARGET_PLATFORM", "ios");
    vi.stubEnv("ADMOB_IOS_APP_ID", "ca-app-pub-1234567890123456~1234567890");
    vi.stubEnv("ADMOB_ANDROID_APP_ID", "");
    vi.stubEnv(
      "EXPO_PUBLIC_ADMOB_IOS_BANNER_ID",
      "ca-app-pub-1234567890123456/1234567890",
    );

    expect(await readAdMobIds()).toMatchObject({
      iosAppId: "ca-app-pub-1234567890123456~1234567890",
    });
  });

  it("rejects a missing ID for the platform being built", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("APP_TARGET_PLATFORM", "android");
    vi.stubEnv("ADMOB_ANDROID_APP_ID", "");

    await expect(readAdMobIds()).rejects.toThrow("ADMOB_ANDROID_APP_ID");
  });
});

describe("production AdMob banner unit IDs", () => {
  it("rejects a production build without a banner ID for that platform", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("APP_TARGET_PLATFORM", "ios");
    vi.stubEnv("ADMOB_IOS_APP_ID", "ca-app-pub-1234567890123456~1234567890");
    vi.stubEnv("EXPO_PUBLIC_ADMOB_IOS_BANNER_ID", "");

    await expect(readConfig()).rejects.toThrow(
      "EXPO_PUBLIC_ADMOB_IOS_BANNER_ID",
    );
  });

  it("rejects Google's sample banner ID in production", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("APP_TARGET_PLATFORM", "ios");
    vi.stubEnv("ADMOB_IOS_APP_ID", "ca-app-pub-1234567890123456~1234567890");
    vi.stubEnv(
      "EXPO_PUBLIC_ADMOB_IOS_BANNER_ID",
      "ca-app-pub-3940256099942544/2435281174",
    );

    await expect(readConfig()).rejects.toThrow(
      "EXPO_PUBLIC_ADMOB_IOS_BANNER_ID",
    );
  });

  it("does not require banner IDs outside production", async () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("EAS_BUILD_PROFILE", "");
    vi.stubEnv("EXPO_PUBLIC_ADMOB_IOS_BANNER_ID", "");

    await expect(readConfig()).resolves.toBeTruthy();
  });
});

describe("SKAdNetwork IDs", () => {
  it("includes Google's full list of buyer IDs", async () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("EAS_BUILD_PROFILE", "");
    const adMob = await readAdMobIds();
    const items = (adMob as { skAdNetworkItems: string[] }).skAdNetworkItems;

    expect(items).toContain("cstr6suwn9.skadnetwork");
    expect(new Set(items).size).toBe(items.length);
    expect(items.length).toBeGreaterThanOrEqual(50);
  });
});
