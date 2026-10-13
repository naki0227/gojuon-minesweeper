import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, Text, View } from "react-native";

import { AppleAccount } from "./AppleAccount";
import { packDiscountPercent } from "./packs";
import { walletStyles as styles } from "./styles";
import type { useGemWallet } from "./useGemWallet";
import { colors } from "../theme/colors";
import { Pressable } from "../components/TapPressable";

type Wallet = ReturnType<typeof useGemWallet>;

// Shown so support can find the account's gem history on inquiry.
export function supportId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function confirmDelete(wallet: Wallet) {
  Alert.alert(
    "アカウントを削除しますか？",
    "ジェム残高と使用履歴が削除され、元に戻せません。購入済みのジェムも返金されません。",
    [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する",
        style: "destructive",
        onPress: () => void wallet.deleteAccount(),
      },
    ],
  );
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
        <Text style={styles.note}>
          Appleでログインすると初回限定で3ジェムをプレゼント。再インストール後も残高を引き継げます。
        </Text>
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
        <Text style={styles.balanceUnit}>ジェム</Text>
      </View>
      <Text style={styles.note}>
        安全マス 1ジェム ／ 4回目以降の復活 3ジェム
      </Text>
      {wallet.products.length === 0 ? (
        <Text style={styles.note}>
          {wallet.loading ? "商品情報を取得中…" : "商品情報を取得できません"}
        </Text>
      ) : null}
      {wallet.products.map((product) => {
        const discount = packDiscountPercent(product);
        return (
          <Pressable
            key={product.productId}
            accessibilityRole="button"
            accessibilityLabel={`${product.gems}ジェムを${product.displayPrice}で購入`}
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
            <Text style={styles.packUnit}>ジェム</Text>
            {discount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{discount}%OFF</Text>
              </View>
            ) : null}
            <View style={styles.spacer} />
            <View style={styles.price}>
              <Text style={styles.priceText}>{product.displayPrice}</Text>
            </View>
          </Pressable>
        );
      })}
      {wallet.buying ? <Text style={styles.note}>購入処理中…</Text> : null}
      {wallet.message ? (
        <Text style={styles.error}>{wallet.message}</Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          お問い合わせID：{supportId(wallet.userId)}
          。ジェムが減ったのにヒントや復活が届かなかったときは、このIDを添えてサポートへご連絡ください。
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => confirmDelete(wallet)}
          hitSlop={8}
        >
          <Text style={styles.deleteText}>アカウントを削除</Text>
        </Pressable>
      </View>
    </>
  );
}
