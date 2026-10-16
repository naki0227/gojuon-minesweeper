import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DocHead } from "../src/components/DocHead";
import { docPageStyles } from "../src/components/docPageStyles";
import { tr } from "../src/i18n";

const S = tr({
  ja: {
    headTitle: "サポート | 五十音マインスイーパー",
    headDescription: "五十音マインスイーパーのサポート情報",
    title: "サポート",
    intro:
      "不具合、問題データの誤り、改善要望は下のメールアドレスまでお送りください。",
    contactHeading: "お問い合わせ",
    contactBody:
      "購入や広告、個人情報の取り扱いなど、公開の場に書きにくい内容はメールでご連絡ください。",
    reportHeading: "報告するときにあると助かる情報",
    reportBody:
      "利用環境（Web / iOS / Android）、発生した画面、再現手順、表示されていたジャンルや文字数を添えてください。",
    gemsBody:
      "ジェムが減ったのにヒントや復活が届かなかった場合は、ジェム画面の「お問い合わせID」とおおよその日時をメールでお知らせください。履歴を確認して、該当分のジェムをお戻しします。",
    privacy: "プライバシーポリシー",
    back: "ゲームへ戻る",
  },
  en: {
    headTitle: "Support | Gojuon Minesweeper",
    headDescription: "Support for Gojuon Minesweeper",
    title: "Support",
    intro:
      "Please send bug reports, mistakes in the word data and feature requests to the email address below.",
    contactHeading: "Contact",
    contactBody:
      "For anything you'd rather not post publicly, such as purchases, ads or how we handle personal information, please email us.",
    reportHeading: "Helpful details for reports",
    reportBody:
      "Please include your platform (Web / iOS / Android), the screen where it happened, steps to reproduce it, and the genre and word length that were shown.",
    gemsBody:
      "If gems were used but you didn't get the hint or revive, email us the “Support ID” from the Gems screen and roughly when it happened. We'll check the history and return those gems.",
    privacy: "Privacy Policy",
    back: "Back to game",
  },
});

export default function SupportScreen() {
  return (
    <>
      <DocHead
        title={S.headTitle}
        description={S.headDescription}
        path="/support"
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.title}>{S.title}</Text>
          <Text style={styles.intro}>{S.intro}</Text>

          <View style={styles.section}>
            <Text style={styles.heading}>{S.contactHeading}</Text>
            <Text style={styles.body}>{S.contactBody}</Text>
            <Link href="mailto:contact@enludus.com" style={styles.link}>
              contact@enludus.com
            </Link>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>{S.reportHeading}</Text>
            <Text style={styles.body}>{S.reportBody}</Text>
            <Text style={styles.body}>{S.gemsBody}</Text>
          </View>

          <Link href="/privacy" style={styles.link}>
            {S.privacy}
          </Link>
          <Link href="/" style={styles.link}>
            {S.back}
          </Link>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = {
  ...docPageStyles,
  ...StyleSheet.create({
    intro: { color: "#536875", fontSize: 15, lineHeight: 24 },
  }),
};
