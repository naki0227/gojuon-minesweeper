import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

import { afterWin, parseReviewState } from "./reviewPolicy";

const KEY = "review.v1";

// Call after the player wins (a match, an online game, an endless
// question). Shows the system rating prompt when the policy says so.
export async function noteWinForReview(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const { state, ask } = afterWin(
      parseReviewState(await AsyncStorage.getItem(KEY)),
      Date.now(),
    );
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
    if (ask && (await StoreReview.isAvailableAsync())) {
      await StoreReview.requestReview();
    }
  } catch {
    // A rating prompt is never worth an error.
  }
}
