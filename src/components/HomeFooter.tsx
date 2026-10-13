import { Link } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";

import { appStoreUrl } from "../links/site";
import { colors } from "../theme/colors";

// Links under the home screen. The web version also points to the iPhone
// app (tagged so App Analytics shows visits that came from the website).
export function HomeFooter() {
  return (
    <View style={styles.links}>
      {Platform.OS === "web" ? (
        <>
          <Link href={appStoreUrl("web_home")} style={styles.link}>
            iPhoneアプリ
          </Link>
          <Text style={styles.separator}>/</Text>
        </>
      ) : null}
      <Link href="/privacy" style={styles.link}>
        プライバシーポリシー
      </Link>
      <Text style={styles.separator}>/</Text>
      <Link href="/support" style={styles.link}>
        サポート
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  link: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 6,
  },
  separator: { color: "#536875", fontSize: 12 },
});
