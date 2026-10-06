import { Pressable, StyleSheet, Text, View } from "react-native";

import { useRemoveAds } from "../purchases/RemoveAdsProvider";

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

  if (owned) {
    return (
      <View style={styles.panel}>
        <Text style={styles.ownedText}>広告は非表示になっています</Text>
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
            広告を非表示にする
            {product ? `（${product.displayPrice}）` : ""}
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
          <Text style={styles.linkText}>購入を復元</Text>
        </Pressable>
      </View>

      {canRedeemCode ? (
        <View style={styles.row}>
          <Text style={styles.caption}>招待コードをお持ちの方</Text>
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
            <Text style={styles.linkText}>コードを使う</Text>
          </Pressable>
        </View>
      ) : null}

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
    borderColor: "#bcddea",
    borderRadius: 9,
    backgroundColor: "#eaf6fb",
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
    color: "#287da5",
    fontSize: 13,
    fontWeight: "700",
  },
  caption: {
    color: "#7b8992",
    fontSize: 12,
  },
  ownedText: {
    color: "#7b8992",
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
