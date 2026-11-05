import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RemoveAdsProvider } from "../src/purchases/RemoveAdsProvider";
import { BackgroundMusic } from "../src/sound/BackgroundMusic";
import {
  TutorialModal,
  useFirstRunTutorial,
} from "../src/tutorial/TutorialModal";

export default function RootLayout() {
  const tutorial = useFirstRunTutorial();
  // The game's rules are not for こどもモード; they show on the next
  // visit to the rest of the app.
  const kids = usePathname().startsWith("/kids");
  return (
    <SafeAreaProvider>
      <RemoveAdsProvider>
        <StatusBar style="dark" />
        <BackgroundMusic />
        <Stack screenOptions={{ headerShown: false }} />
        <TutorialModal
          visible={tutorial.visible && !kids}
          onClose={tutorial.close}
        />
      </RemoveAdsProvider>
    </SafeAreaProvider>
  );
}
