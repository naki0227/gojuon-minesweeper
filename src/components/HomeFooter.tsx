import { Link } from "expo-router";
import Head from "expo-router/head";
import { Platform, StyleSheet, Text, View } from "react-native";

import { LOCALE, tr } from "../i18n";
import { switchWebLanguage, WEB_ROOTS } from "../i18n/web";
import { appStoreUrl } from "../links/site";
import { colors } from "../theme/colors";

const S = tr({
  ja: {
    app: "iPhoneアプリ",
    privacy: "プライバシーポリシー",
    support: "サポート",
  },
  en: { app: "iPhone app", privacy: "Privacy Policy", support: "Support" },
});

// Links under the home screen. The web version also points to the iPhone
// app (tagged so App Analytics shows visits that came from the website)
// and to the other language's build.
export function HomeFooter() {
  const other = LOCALE === "ja" ? "en" : "ja";
  return (
    <View style={styles.links}>
      {Platform.OS === "web" ? (
        <>
          <Head>
            <link rel="alternate" hrefLang="ja" href={WEB_ROOTS.ja} />
            <link rel="alternate" hrefLang="en" href={WEB_ROOTS.en} />
            <link rel="alternate" hrefLang="x-default" href={WEB_ROOTS.ja} />
          </Head>
          <Text
            accessibilityRole="link"
            style={styles.link}
            onPress={() => switchWebLanguage(other)}
          >
            {other === "en" ? "English" : "日本語"}
          </Text>
          <Text style={styles.separator}>/</Text>
        </>
      ) : null}
      {Platform.OS === "web" ? (
        <>
          <Link href={appStoreUrl("web_home")} style={styles.link}>
            {S.app}
          </Link>
          <Text style={styles.separator}>/</Text>
        </>
      ) : null}
      <Link href="/privacy" style={styles.link}>
        {S.privacy}
      </Link>
      <Text style={styles.separator}>/</Text>
      <Link href="/support" style={styles.link}>
        {S.support}
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
