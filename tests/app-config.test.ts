import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConfigContext } from "expo/config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function readAdMobIds() {
  vi.resetModules();
  const { default: createConfig } = await import("../app.config");
  const context: ConfigContext = {
    projectRoot: process.cwd(),
    staticConfigPath: null,
    packageJsonPath: null,
    config: { name: "test", slug: "test" },
  };
  const config = createConfig(context);
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
