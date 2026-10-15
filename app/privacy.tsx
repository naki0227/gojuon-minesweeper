import { Link } from "expo-router";
import Head from "expo-router/head";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdPrivacyOptionsButton } from "../src/ads/AdPrivacyOptionsButton";
import { docPageStyles } from "../src/components/docPageStyles";
import { PRIVACY_TEXT as S } from "../src/legal/privacy.strings";
import { colors } from "../src/theme/colors";

function Section({ heading, body }: { heading: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  return (
    <>
      <Head>
        <title>{S.headTitle}</title>
        <meta name="description" content={S.headDescription} />
        <link rel="canonical" href="https://minesweeper.enludus.com/privacy" />
      </Head>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.title}>{S.title}</Text>
          <Text style={styles.updated}>{S.updated}</Text>

          <Section {...S.collected} />
          <Section {...S.usage} />

          <View style={styles.section}>
            <Text style={styles.heading}>{S.ads.heading}</Text>
            <Text style={styles.body}>{S.ads.intro}</Text>
            <Text style={styles.body}>{S.ads.collects}</Text>
            <Text style={styles.body}>{S.ads.items.join("\n")}</Text>
            <Text style={styles.body}>{S.ads.tracking}</Text>
            <Link href={S.ads.partnerSitesHref} style={styles.inlineLink}>
              {S.ads.partnerSites}
            </Link>
            <Link href={S.ads.adsPolicyHref} style={styles.inlineLink}>
              {S.ads.adsPolicy}
            </Link>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>{S.consent.heading}</Text>
            <Text style={styles.body}>{S.consent.body}</Text>
            <AdPrivacyOptionsButton />
            <Text style={styles.body}>{S.consent.other}</Text>
            <Link
              href="https://myadcenter.google.com/"
              style={styles.inlineLink}
            >
              {S.consent.adCenter}
            </Link>
          </View>

          <Section {...S.removeAds} />

          <View style={styles.section}>
            <Text style={styles.heading}>{S.retention.heading}</Text>
            <Text style={styles.body}>{S.retention.body}</Text>
            <Text style={styles.body}>{S.retention.contact}</Text>
            <Link href="mailto:contact@enludus.com" style={styles.inlineLink}>
              contact@enludus.com
            </Link>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>{S.online.heading}</Text>
            <Text style={styles.body}>{S.online.body}</Text>
            <Text style={styles.body}>{S.online.visibility}</Text>
          </View>

          <Section {...S.daily} />
          <Section {...S.thirdParties} />
          <Section {...S.changes} />

          <Link href="/support" style={styles.link}>
            {S.support}
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
    updated: { color: "#73838d", fontSize: 12 },
    inlineLink: { color: colors.link, fontSize: 14, fontWeight: "700" },
  }),
};
