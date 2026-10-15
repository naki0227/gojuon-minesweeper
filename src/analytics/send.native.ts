import Constants, { ExecutionEnvironment } from "expo-constants";

import type { AnalyticsParams } from "./events";

type FirebaseAnalytics = typeof import("@react-native-firebase/analytics");

// Firebase is a native module that Expo Go and builds without
// GoogleService-Info.plist (see app.config.ts) do not have.
function loadAnalytics(): FirebaseAnalytics | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@react-native-firebase/analytics") as FirebaseAnalytics;
  } catch {
    return null;
  }
}

const firebase = loadAnalytics();

export function sendEvent(name: string, params: AnalyticsParams): void {
  if (!firebase) return;
  try {
    Promise.resolve(
      firebase.logEvent(firebase.getAnalytics(), name, { ...params }),
    ).catch(() => {});
  } catch {
    // Analytics must never break the game.
  }
}
