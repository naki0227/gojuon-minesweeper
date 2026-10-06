import { Link } from "expo-router";
import Head from "expo-router/head";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  return (
    <>
      <Head>
        <title>プライバシーポリシー | 五十音マインスイーパー</title>
        <meta
          name="description"
          content="五十音マインスイーパーのプライバシーポリシー"
        />
        <link rel="canonical" href="https://minesweeper.enludus.com/privacy" />
      </Head>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.title}>プライバシーポリシー</Text>
          <Text style={styles.updated}>最終更新: 2026年10月6日</Text>

          <View style={styles.section}>
            <Text style={styles.heading}>取得する情報</Text>
            <Text style={styles.body}>
              現在、本サービスはアカウント登録を必要とせず、氏名、住所、電話番号などの個人情報をゲーム利用のために要求しません。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>利用状況データ</Text>
            <Text style={styles.body}>
              サービス品質の改善を目的として、ゲーム開始・終了、回答、盤面操作、利用環境などの匿名化された利用状況データを分析する場合があります。分析機能を導入した場合は、利用するサービスと取得内容を本ページで明示します。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>広告</Text>
            <Text style={styles.body}>
              本サービスは広告配信サービスとしてGoogleを利用しています（iOS・Android版はGoogle AdMob、Web版はGoogle AdSense）。広告はゲーム設定画面と結果画面にのみ表示し、対局中には表示しません。
            </Text>
            <Text style={styles.body}>
              広告の配信・効果測定・不正防止のため、Cookie、広告識別子、IPアドレス、端末やブラウザの種類、おおよその位置情報、広告の表示やタップの状況などの情報がGoogleにより処理される場合があります。地域によっては、広告に関する同意を確認する画面が表示されます。
            </Text>
            <Text style={styles.body}>
              Googleによる情報の取り扱いは、Googleのポリシーをご確認ください。パーソナライズ広告はGoogleの広告設定から管理できます。
            </Text>
            <Link
              href="https://policies.google.com/technologies/partner-sites?hl=ja"
              style={styles.inlineLink}
            >
              Googleのパートナーサイトでのデータ利用について
            </Link>
            <Link
              href="https://policies.google.com/technologies/ads?hl=ja"
              style={styles.inlineLink}
            >
              Googleの広告に関するポリシー
            </Link>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>広告の非表示（アプリ内課金）</Text>
            <Text style={styles.body}>
              アプリ版では、広告を非表示にするアプリ内課金を提供します。決済はApple（App Store）またはGoogle（Google Play）が行い、本サービスがクレジットカード番号などの決済情報を取得することはありません。購入状態は端末上で各ストアに照会して確認します。購入はWeb版には引き継がれません。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>オンライン対戦</Text>
            <Text style={styles.body}>
              オンライン対戦機能を提供する場合、対戦ルームの識別子、参加者を区別するための一時的な識別子、対戦状態などを処理することがあります。ゲーム進行に不要な個人情報は要求しません。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>第三者提供</Text>
            <Text style={styles.body}>
              法令に基づく場合を除き、取得した情報を第三者へ販売しません。外部サービスを利用する場合は、サービス提供に必要な範囲で情報が処理されることがあります。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>変更</Text>
            <Text style={styles.body}>
              機能追加や利用サービスの変更に伴い、本ポリシーを更新することがあります。重要な変更は本ページ上で告知します。
            </Text>
          </View>

          <Link href="/support" style={styles.link}>サポート</Link>
          <Link href="/" style={styles.link}>ゲームへ戻る</Link>
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
  updated: { color: "#73838d", fontSize: 12 },
  section: { gap: 7 },
  heading: { color: "#263c49", fontSize: 17, fontWeight: "800" },
  body: { color: "#536875", fontSize: 14, lineHeight: 23 },
  link: { color: "#287da5", fontWeight: "700", marginTop: 4 },
  inlineLink: { color: "#287da5", fontSize: 14, fontWeight: "700" },
});
