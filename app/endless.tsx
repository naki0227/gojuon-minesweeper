import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { EndlessScreen } from "../src/endless/EndlessScreen";

export default function EndlessRoute() {
  return Platform.OS === "ios" ? <EndlessScreen /> : <Redirect href="/" />;
}
