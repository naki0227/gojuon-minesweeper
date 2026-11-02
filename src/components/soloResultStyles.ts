import { StyleSheet } from "react-native";

import { colors } from "../theme/colors";
import { buttonStyles } from "./buttonStyles";

// The panel that replaces the answer box when a SoloBoard game ends.
export const soloResultStyles = StyleSheet.create({
  result: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#cfdce4",
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  resultTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  resultText: { color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primary: buttonStyles.primaryButton,
  primaryText: buttonStyles.primaryButtonText,
  secondary: buttonStyles.secondaryButton,
  secondaryText: buttonStyles.secondaryButtonText,
});
