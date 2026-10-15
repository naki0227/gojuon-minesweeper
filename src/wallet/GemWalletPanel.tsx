import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, Text, View } from "react-native";

import { AppleAccount } from "./AppleAccount";
import { packDiscountPercent } from "./packs";
import { walletStyles as styles } from "./styles";
import type { useGemWallet } from "./useGemWallet";
import { colors } from "../theme/colors";
import { Pressable } from "../components/TapPressable";
import { tr } from "../i18n";

const S = tr({
  ja: {
    deleteTitle: "アカウントを削除しますか？",
    deleteBody:
      "ジェム残高と使用履歴が削除され、元に戻せません。購入済みのジェムも返金されません。",
    cancel: "キャンセル",
    delete: "削除する",
    signInNote:
      "Appleでログインすると初回限定で3ジェムをプレゼント。再インストール後も残高を引き継げます。",
    unit: "ジェム",
    costs: "安全マス 1ジェム ／ 4回目以降の復活 3ジェム",
    loadingProducts: "商品情報を取得中…",
    noProducts: "商品情報を取得できません",
    buyLabel: (gems: number, price: string) => `${gems}ジェムを${price}で購入`,
    off: (percent: number) => `${percent}%OFF`,
    buying: "購入処理中…",
    supportId: (id: string) => `お問い合わせID：${id}`,
    supportNote:
      "。ジェムが減ったのにヒントや復活が届かなかったときは、このIDを添えてサポートへご連絡ください。",
    deleteAccount: "アカウントを削除",
  },
  en: {
    deleteTitle: "Delete your account?",
    deleteBody:
      "Your gem balance and history will be deleted. This can't be undone, and purchased gems won't be refunded.",
    cancel: "Cancel",
    delete: "Delete",
    signInNote:
      "Sign in with Apple to get 3 free gems (first time only). Your balance stays even if you reinstall.",
    unit: "gems",
    costs: "Safe tile: 1 gem / Revive (4th and later): 3 gems",
    loadingProducts: "Loading gem packs…",
    noProducts: "Couldn't load gem packs",
    buyLabel: (gems: number, price: string) => `Buy ${gems} gems for ${price}`,
    off: (percent: number) => `${percent}% OFF`,
    buying: "Processing purchase…",
    supportId: (id: string) => `Support ID: ${id}`,
    supportNote:
      ". If gems were used but you didn't get the hint or revive, contact support with this ID.",
    deleteAccount: "Delete account",
  },
});

type Wallet = ReturnType<typeof useGemWallet>;

// Shown so support can find the account's gem history on inquiry.
export function supportId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function confirmDelete(wallet: Wallet) {
  Alert.alert(S.deleteTitle, S.deleteBody, [
    { text: S.cancel, style: "cancel" },
    {
      text: S.delete,
      style: "destructive",
      onPress: () => void wallet.deleteAccount(),
    },
  ]);
}

// The biggest discount is highlighted as the best value.
function bestProductId(wallet: Wallet): string | null {
  const best = [...wallet.products].sort(
    (a, b) => packDiscountPercent(b) - packDiscountPercent(a),
  )[0];
  return best && packDiscountPercent(best) > 0 ? best.productId : null;
}

export function GemWalletPanel({ wallet }: { wallet: Wallet }) {
  if (!wallet.enabled) return null;
  if (!wallet.userId) {
    return (
      <>
        <Text style={styles.note}>{S.signInNote}</Text>
        <AppleAccount onSignedIn={() => void wallet.refresh()} />
        {wallet.message ? (
          <Text style={styles.error}>{wallet.message}</Text>
        ) : null}
      </>
    );
  }
  const best = bestProductId(wallet);
  const disabled = wallet.buying || wallet.loading;
  return (
    <>
      <View style={styles.balance}>
        <MaterialIcons name="diamond" size={26} color={colors.gem} />
        <Text style={styles.balanceValue}>
          {wallet.balance === null ? "…" : wallet.balance.toLocaleString()}
        </Text>
        <Text style={styles.balanceUnit}>{S.unit}</Text>
      </View>
      <Text style={styles.note}>{S.costs}</Text>
      {wallet.products.length === 0 ? (
        <Text style={styles.note}>
          {wallet.loading ? S.loadingProducts : S.noProducts}
        </Text>
      ) : null}
      {wallet.products.map((product) => {
        const discount = packDiscountPercent(product);
        return (
          <Pressable
            key={product.productId}
            accessibilityRole="button"
            accessibilityLabel={S.buyLabel(product.gems, product.displayPrice)}
            style={[
              styles.pack,
              product.productId === best && styles.packBest,
              disabled && styles.disabled,
            ]}
            disabled={disabled}
            onPress={() => void wallet.purchase(product.productId)}
          >
            <MaterialIcons name="diamond" size={18} color={colors.gem} />
            <Text style={styles.packGems}>{product.gems.toLocaleString()}</Text>
            <Text style={styles.packUnit}>{S.unit}</Text>
            {discount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{S.off(discount)}</Text>
              </View>
            ) : null}
            <View style={styles.spacer} />
            <View style={styles.price}>
              <Text style={styles.priceText}>{product.displayPrice}</Text>
            </View>
          </Pressable>
        );
      })}
      {wallet.buying ? <Text style={styles.note}>{S.buying}</Text> : null}
      {wallet.message ? (
        <Text style={styles.error}>{wallet.message}</Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {S.supportId(supportId(wallet.userId))}
          {S.supportNote}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => confirmDelete(wallet)}
          hitSlop={8}
        >
          <Text style={styles.deleteText}>{S.deleteAccount}</Text>
        </Pressable>
      </View>
    </>
  );
}
