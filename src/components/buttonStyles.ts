import { StyleSheet } from "react-native";

import { colors } from "../theme/colors";

// The app's buttons. Screens spread these and add only layout (width,
// flexGrow) so every primary and secondary button looks the same.
export const buttonStyles = StyleSheet.create({
  primaryButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b9c9d3",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#405967",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: { opacity: 0.4 },
  pressedButton: { opacity: 0.72 },
});
