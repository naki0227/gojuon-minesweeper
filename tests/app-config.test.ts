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
    vi.stubEnv("GOOGLE_SERVICE_INFO_PLIST", "/tmp/GoogleService-Info.plist");
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("EAS_BUILD", "true");
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
    vi.stubEnv("EAS_BUILD", "true");
    vi.stubEnv("APP_TARGET_PLATFORM", "android");
    vi.stubEnv("ADMOB_ANDROID_APP_ID", "");

    await expect(readAdMobIds()).rejects.toThrow("ADMOB_ANDROID_APP_ID");
  });
});

describe("reading the config before an EAS build", () => {
  it("does not require AdMob IDs on the computer that starts the build", async () => {
    vi.stubEnv("EAS_BUILD_PROFILE", "production");
    vi.stubEnv("EAS_BUILD", "");
    vi.stubEnv("ADMOB_IOS_APP_ID", "");
    vi.stubEnv("ADMOB_ANDROID_APP_ID", "");
    vi.stubEnv("EXPO_PUBLIC_ADMOB_IOS_BANNER_ID", "");

    const config = await readConfig();
    expect(config.extra?.ads).toEqual({ useTestIds: false });
  });
});

describe("production AdMob banner unit IDs", () => {
  it("rejects a production build without a banner ID for that platform", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("EAS_BUILD", "true");
    vi.stubEnv("APP_TARGET_PLATFORM", "ios");
    vi.stubEnv("ADMOB_IOS_APP_ID", "ca-app-pub-1234567890123456~1234567890");
    vi.stubEnv("EXPO_PUBLIC_ADMOB_IOS_BANNER_ID", "");

    await expect(readConfig()).rejects.toThrow(
      "EXPO_PUBLIC_ADMOB_IOS_BANNER_ID",
    );
  });

  it("rejects Google's sample banner ID in production", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("EAS_BUILD", "true");
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

describe("Firebase Analytics", () => {
  function productionIos() {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("EAS_BUILD", "true");
    vi.stubEnv("APP_TARGET_PLATFORM", "ios");
    vi.stubEnv("ADMOB_IOS_APP_ID", "ca-app-pub-1234567890123456~1234567890");
    vi.stubEnv(
      "EXPO_PUBLIC_ADMOB_IOS_BANNER_ID",
      "ca-app-pub-1234567890123456/1234567890",
    );
  }

  it("rejects a production iOS build without GoogleService-Info.plist", async () => {
    productionIos();
    vi.stubEnv("GOOGLE_SERVICE_INFO_PLIST", "");
    await expect(readConfig()).rejects.toThrow("GOOGLE_SERVICE_INFO_PLIST");
  });

  it("adds Firebase with static CocoaPods linking when the plist is given", async () => {
    productionIos();
    vi.stubEnv("GOOGLE_SERVICE_INFO_PLIST", "/tmp/GoogleService-Info.plist");
    const config = await readConfig();
    expect(config.ios?.googleServicesFile).toBe(
      "/tmp/GoogleService-Info.plist",
    );
    const names = config.plugins?.map((plugin) =>
      Array.isArray(plugin) ? plugin[0] : plugin,
    );
    expect(names).toContain("@react-native-firebase/app");
    const build = config.plugins?.find(
      (plugin) =>
        Array.isArray(plugin) && plugin[0] === "expo-build-properties",
    ) as [string, { ios: Record<string, unknown> }];
    expect(build[1].ios).toMatchObject({
      useFrameworks: "static",
      enableSceneSupport: true,
    });
  });

  it("leaves Firebase out of local builds without the plist", async () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("EAS_BUILD_PROFILE", "");
    vi.stubEnv("GOOGLE_SERVICE_INFO_PLIST", "");
    const config = await readConfig();
    expect(JSON.stringify(config.plugins)).not.toContain("firebase");
  });
});
