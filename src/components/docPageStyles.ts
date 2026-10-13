import { StyleSheet } from "react-native";

// Layout shared by the text pages (privacy policy, support).
export const docPageStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7fafc" },
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 18,
  },
  title: { color: "#102433", fontSize: 30, fontWeight: "900" },
  section: { gap: 7 },
  heading: { color: "#263c49", fontSize: 17, fontWeight: "800" },
  body: { color: "#536875", fontSize: 14, lineHeight: 23 },
  link: { color: "#287da5", fontWeight: "700", marginTop: 4 },
});
