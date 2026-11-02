import { StyleSheet } from "react-native";

import { colors } from "../theme/colors";
import { buttonStyles } from "./buttonStyles";
import { matchStyles } from "./matchStyles";

// Styles of LocalMatch.tsx.
export const localMatchStyles = {
  ...matchStyles,
  ...StyleSheet.create({
    page: {
      width: "100%",
      maxWidth: 760,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
      gap: 10,
    },
    prompt: {
      flex: 1,
      color: colors.ink,
      fontSize: 22,
      fontWeight: "900",
      lineHeight: 30,
    },
    helperText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    gameTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    changeButton: {
      minHeight: 38,
      justifyContent: "center",
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "#c4d1d9",
      borderRadius: 9,
      backgroundColor: colors.white,
    },
    changeButtonText: {
      color: "#526975",
      fontSize: 12,
      fontWeight: "800",
    },
    turnPanel: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primaryBorder,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    // Player 2's turn is orange so passing the phone is easy to notice.
    turnP2: { backgroundColor: "#fff1e4", borderColor: "#f2c9a0" },
    turnPlayerP2: { color: "#8a3f10" },
    answerActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    primaryButton: { ...buttonStyles.primaryButton, flexGrow: 1 },
    resultPanel: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: "#cfdce4",
      borderRadius: 14,
      padding: 18,
      gap: 10,
    },
    resultAnswer: {
      color: "#596d79",
      fontSize: 16,
      marginBottom: 4,
    },
  }),
};
