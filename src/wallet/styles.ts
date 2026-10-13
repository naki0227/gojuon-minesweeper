import { StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const MUTED = "#647786";
const LINE = "#dbe3ea";

export const walletStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },
  title: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  body: { paddingHorizontal: 16, paddingBottom: 18, gap: 10 },
  balance: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingVertical: 4,
  },
  balanceValue: { color: colors.ink, fontSize: 32, fontWeight: "900" },
  balanceUnit: { color: MUTED, fontSize: 14, fontWeight: "800" },
  note: { color: MUTED, fontSize: 12, lineHeight: 18, textAlign: "center" },
  pack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 52,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  packBest: { borderColor: colors.gem, backgroundColor: "#f3f5ff" },
  packGems: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  packUnit: { color: MUTED, fontSize: 12, fontWeight: "700", flexShrink: 0 },
  badge: {
    borderRadius: 999,
    backgroundColor: "#ffe9d6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  badgeText: { color: "#b5531a", fontSize: 11, fontWeight: "900" },
  spacer: { flex: 1 },
  price: {
    minWidth: 72,
    flexShrink: 0,
    borderRadius: 999,
    backgroundColor: colors.gem,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center",
  },
  priceText: { color: colors.white, fontSize: 13, fontWeight: "900" },
  footer: {
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 10,
    gap: 6,
  },
  footerText: { color: MUTED, fontSize: 11, lineHeight: 16 },
  deleteText: { color: "#ae3e31", fontSize: 12, fontWeight: "800" },
  error: { color: "#ae3e31", fontWeight: "700", fontSize: 12 },
  disabled: { opacity: 0.4 },
});
