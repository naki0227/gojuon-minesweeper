import { Redirect } from "expo-router";
import { Platform } from "react-native";

import { DailyScreen } from "../src/daily/DailyScreen";

// The web has its own 今日の一問 pages (/daily/), written by publish.ts.
export default function TodayRoute() {
  return Platform.OS === "web" ? <Redirect href="/" /> : <DailyScreen />;
}
