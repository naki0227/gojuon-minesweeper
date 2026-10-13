import { StyleSheet } from "react-native";

import { matchStyles } from "../components/matchStyles";
import { colors } from "../theme/colors";

// Styles of the online screen's panels, shared with its lobby.
export const lobbyStyles = {
  ...matchStyles,
  ...StyleSheet.create({
    panel: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: "#cfdce4",
      borderRadius: 14,
      padding: 18,
      gap: 10,
    },
    panelTitle: {
      color: colors.inkSoft,
      fontSize: 18,
      fontWeight: "900",
    },
    helperText: {
      color: "#627481",
      fontSize: 13,
      lineHeight: 20,
    },
    note: {
      color: colors.success,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
  }),
};
