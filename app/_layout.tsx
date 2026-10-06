import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RemoveAdsProvider } from "../src/purchases/RemoveAdsProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RemoveAdsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </RemoveAdsProvider>
    </SafeAreaProvider>
  );
}
