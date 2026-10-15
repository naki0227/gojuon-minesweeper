import { StyleSheet, Text, View } from "react-native";

import { tr } from "../i18n";
import { useRemoveAds } from "../purchases/RemoveAdsProvider";
import { colors } from "../theme/colors";
import { Pressable } from "./TapPressable";

const S = tr({
  ja: {
    codeCaption: "プレゼントのコードをお持ちの方",
    redeem: "コードを使う",
    owned: "広告は非表示になっています",
    removeAds: "広告を非表示にする",
    price: (price: string) => `（${price}）`,
    restore: "購入を復元",
  },
  en: {
    codeCaption: "Have a gift code?",
    redeem: "Redeem code",
    owned: "Ads are removed",
    removeAds: "Remove ads",
    price: (price: string) => ` (${price})`,
    restore: "Restore purchase",
  },
});

// Remove-ads purchase, restore and offer-code entry shown under the setup
// screen ad. Renders nothing where no store exists (web, Expo Go).
export function RemoveAdsOptions() {
  const {
    status,
    owned,
    product,
    busy,
    message,
    canPurchase,
    canRedeemCode,
    purchase,
    restore,
    redeemCode,
  } = useRemoveAds();

  if (status !== "ready") {
    return null;
  }

  // Offer codes also give gems (今日の一問 プレゼント), so the entry stays
  // after ads are removed.
  const codeRow = canRedeemCode ? (
    <View style={styles.row}>
      <Text style={styles.caption}>{S.codeCaption}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={redeemCode}
        style={({ pressed }) => [
          styles.linkButton,
          busy ? styles.disabled : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.linkText}>{S.redeem}</Text>
      </Pressable>
    </View>
  ) : null;

  if (owned) {
    return (
      <View style={styles.panel}>
        <Text style={styles.ownedText}>{S.owned}</Text>
        {codeRow}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          disabled={!canPurchase || busy}
          onPress={purchase}
          style={({ pressed }) => [
            styles.button,
            !canPurchase || busy ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.buttonText}>
            {S.removeAds}
            {product ? S.price(product.displayPrice) : ""}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={restore}
          style={({ pressed }) => [
            styles.linkButton,
            busy ? styles.disabled : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.linkText}>{S.restore}</Text>
        </Pressable>
      </View>

      {codeRow}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  button: {
    minHeight: 38,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: "#1f617f",
    fontSize: 13,
    fontWeight: "800",
  },
  linkButton: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  linkText: {
    color: colors.link,
    fontSize: 13,
    fontWeight: "700",
  },
  caption: {
    color: colors.muted,
    fontSize: 12,
  },
  ownedText: {
    color: colors.muted,
    fontSize: 12,
  },
  message: {
    color: "#526975",
    fontSize: 12,
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.72,
  },
});
