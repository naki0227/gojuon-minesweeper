import { StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { buttonStyles } from "./buttonStyles";

// Styles shared by the local (app/index) and online (app/online) match
// screens, so the two stay visually identical.
export const matchStyles = {
  ...buttonStyles,
  ...StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    turnWho: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    turnCaption: {
      color: "#637b89",
      fontSize: 11,
      fontWeight: "700",
    },
    turnPlayer: {
      color: colors.inkSoft,
      fontSize: 17,
      fontWeight: "900",
    },
    phaseBadge: {
      backgroundColor: colors.white,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    phaseText: {
      color: "#28566e",
      fontSize: 13,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    messagePanel: {
      minHeight: 36,
      justifyContent: "center",
      borderLeftColor: colors.accent,
      borderLeftWidth: 3,
      paddingLeft: 12,
    },
    message: {
      color: "#3e4c56",
      fontSize: 14,
      lineHeight: 21,
    },
    answerArea: {
      gap: 10,
    },
    input: {
      minHeight: 48,
      backgroundColor: colors.white,
      borderColor: "#bdcbd5",
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      color: "#142733",
      fontSize: 16,
    },
    inputDisabled: {
      backgroundColor: "#eef2f5",
      color: "#84919a",
    },
    resultTitle: {
      color: colors.inkSoft,
      fontSize: 24,
      fontWeight: "900",
    },
  }),
};
