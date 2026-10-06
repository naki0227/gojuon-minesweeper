import { Link } from "expo-router";
import Head from "expo-router/head";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdPrivacyOptionsButton } from "../src/ads/AdPrivacyOptionsButton";

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
              本サービスは広告配信サービスとしてGoogleを利用しています（iOS・Android版はGoogle
              AdMob、Web版はGoogle
              AdSense）。広告はゲーム設定画面と結果画面にのみ表示し、対局中には表示しません。
            </Text>
            <Text style={styles.body}>
              広告の配信、効果測定、不正防止のために、Googleが次の情報を収集・処理することがあります。
            </Text>
            <Text style={styles.body}>
              ・IPアドレスと、そこから推定されるおおよその位置{"\n"}
              ・端末の識別子（iOSのベンダー識別子、Androidの広告ID、Web版のCookieなど）
              {"\n"}
              ・広告の表示やタップなどの広告データ{"\n"}
              ・アプリやページの操作情報{"\n"}
              ・クラッシュやパフォーマンスの情報{"\n"}
              ・端末、OS、ブラウザの種類
            </Text>
            <Text style={styles.body}>
              iOS・Android版では「Appのトラッキング」の許可を求めず、AdMobには非パーソナライズ広告のみをリクエストしています。Web版では、Googleの同意管理の結果に応じて、Cookieを使ったパーソナライズ広告が表示される場合があります。
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
            <Text style={styles.heading}>広告に関する同意の変更・撤回</Text>
            <Text style={styles.body}>
              欧州経済領域・英国など同意が必要な地域では、初回に広告に関する同意を確認します。同意の内容は、下の「広告のプライバシー設定を変更する」からいつでも変更・撤回できます（同意が必要な地域でのみ表示されます）。
            </Text>
            <AdPrivacyOptionsButton />
            <Text style={styles.body}>
              ほかに、Androidでは端末の設定から広告IDを削除またはリセットでき、Web版ではブラウザのCookieを削除するか、Googleの広告設定でパーソナライズ広告を無効にできます。
            </Text>
            <Link
              href="https://myadcenter.google.com/"
              style={styles.inlineLink}
            >
              Googleのマイ アド センター
            </Link>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>広告の非表示（アプリ内課金）</Text>
            <Text style={styles.body}>
              アプリ版では、広告を非表示にするアプリ内課金を提供します。決済はApple（App
              Store）またはGoogle（Google
              Play）が行い、本サービスがクレジットカード番号などの決済情報を取得することはありません。購入状態は端末上で各ストアに照会して確認します。購入はWeb版には引き継がれません。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>保存期間と削除</Text>
            <Text style={styles.body}>
              本サービス自体は、サーバーに個人情報や利用状況データを保存していません。ゲームの状態は端末内だけで扱い、アプリを削除すると消えます。購入履歴はAppleまたはGoogleが管理します。Googleが広告のために処理する情報の保存期間と削除方法は、上記のGoogleのポリシーに従います。
            </Text>
            <Text style={styles.body}>
              情報の取り扱いに関するお問い合わせや削除のご相談は、サポートページの窓口からご連絡ください。
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

          <Link href="/support" style={styles.link}>
            サポート
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
  updated: { color: "#73838d", fontSize: 12 },
  section: { gap: 7 },
  heading: { color: "#263c49", fontSize: 17, fontWeight: "800" },
  body: { color: "#536875", fontSize: 14, lineHeight: 23 },
  link: { color: "#287da5", fontWeight: "700", marginTop: 4 },
  inlineLink: { color: "#287da5", fontSize: 14, fontWeight: "700" },
});
