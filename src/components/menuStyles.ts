import { StyleSheet } from "react-native";

import { colors } from "../theme/colors";

// A plain page with a title, a lead and a way back: the bot's level
// picker and the 詰め五十音 list.
export const menuStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    padding: 20,
    gap: 12,
  },
  title: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  lead: { color: colors.inkSoft, fontSize: 15, lineHeight: 22 },
  back: { alignSelf: "center", padding: 12 },
  backText: { color: colors.link, fontSize: 15, fontWeight: "700" },
});
