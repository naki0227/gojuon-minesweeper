import { StyleSheet } from "react-native";

import { colors } from "../theme/colors";

// How a board tile looks in each state. Shared by the game board and the
// tutorial's mini board so the tutorial shows exactly what players see.
export const tileStyles = StyleSheet.create({
  slot: {
    position: "relative",
  },
  face: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    overflow: "hidden",
  },
  closed: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#c9d5df",
    borderBottomWidth: 3,
    borderBottomColor: "#bccbd6",
  },
  hinted: {
    backgroundColor: "#d4f5dd",
    borderColor: "#5db47a",
    borderBottomColor: "#379361",
  },
  closedChar: {
    color: "#152534",
    fontWeight: "800",
    marginTop: 1,
  },
  safe: {
    backgroundColor: "#e6edf2",
    borderWidth: 1,
    borderColor: "#d8e0e6",
  },
  openChar: {
    position: "absolute",
    color: "#8696a1",
    fontWeight: "800",
  },
  count: {
    fontWeight: "900",
  },
  mine: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentStrong,
    borderBottomWidth: 3,
  },
  mineDot: {
    position: "absolute",
    backgroundColor: "#c96a14",
  },
  mineChar: {
    color: colors.white,
    fontWeight: "900",
  },
  mineMultiplicity: {
    position: "absolute",
    right: 2,
    bottom: 1,
    color: colors.white,
    fontWeight: "900",
  },
  ring: {
    position: "absolute",
    left: 0,
    top: 0,
    borderColor: "#ffcf4a",
  },
  spark: {
    position: "absolute",
  },
});
