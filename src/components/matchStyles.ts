import { StyleSheet } from "react-native";

// Styles shared by the local (app/index) and online (app/online) match
// screens, so the two stay visually identical.
export const matchStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7fafc",
  },
  turnWho: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  turnCaption: {
    color: "#637b89",
    fontSize: 11,
    fontWeight: "700",
  },
  turnPlayer: {
    color: "#173f55",
    fontSize: 17,
    fontWeight: "900",
  },
  phaseBadge: {
    backgroundColor: "#ffffff",
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
    borderLeftColor: "#e98a2f",
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
    backgroundColor: "#ffffff",
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
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 46,
    borderColor: "#b9c9d3",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#405967",
    fontWeight: "800",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.4,
  },
  pressedButton: {
    opacity: 0.72,
  },
  resultTitle: {
    color: "#173f55",
    fontSize: 24,
    fontWeight: "900",
  },
});
