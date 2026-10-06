import { Link } from "expo-router";
import Head from "expo-router/head";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupportScreen() {
  return (
    <>
      <Head>
        <title>サポート | 五十音マインスイーパー</title>
        <meta
          name="description"
          content="五十音マインスイーパーのサポート情報"
        />
        <link rel="canonical" href="https://minesweeper.enludus.com/support" />
      </Head>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.title}>サポート</Text>
          <Text style={styles.intro}>
            不具合、問題データの誤り、改善要望はGitHub Issuesから報告できます。
          </Text>

          <View style={styles.section}>
            <Text style={styles.heading}>報告するときにあると助かる情報</Text>
            <Text style={styles.body}>
              利用環境（Web / iOS /
              Android）、発生した画面、再現手順、表示されていたジャンルや文字数を添えてください。
            </Text>
          </View>

          <Link
            href="https://github.com/naki0227/gojuon-minesweeper/issues"
            style={styles.link}
          >
            GitHub Issuesを開く
          </Link>
          <Link href="/privacy" style={styles.link}>
            プライバシーポリシー
          </Link>
          <Link href="/" style={styles.link}>
            ゲームへ戻る
          </Link>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
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
  intro: { color: "#536875", fontSize: 15, lineHeight: 24 },
  section: { gap: 7 },
  heading: { color: "#263c49", fontSize: 17, fontWeight: "800" },
  body: { color: "#536875", fontSize: 14, lineHeight: 23 },
  link: { color: "#287da5", fontWeight: "700", marginTop: 4 },
});
