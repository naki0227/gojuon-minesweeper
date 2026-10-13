import { Alert, Pressable, Text, View } from "react-native";
import { AppleAccount } from "./AppleAccount";
import { styles } from "../endless/styles";
import { useGemWallet } from "./useGemWallet";

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

export function GemWalletPanel({ wallet }: { wallet: Wallet }) {
  if (!wallet.enabled) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.noticeTitle}>ジェム</Text>
      {!wallet.userId ? (
        <>
          <Text style={styles.panelText}>
            Appleでログインすると初回限定で3ジェムをプレゼント。ジェム残高は再インストール後も引き継げます。
          </Text>
          <AppleAccount onSignedIn={() => void wallet.refresh()} />
        </>
      ) : (
        <>
          <Text style={styles.statValue}>
            残高：{wallet.balance === null ? "同期中" : wallet.balance} ジェム
          </Text>
          <Pressable
            style={[
              styles.primary,
              (!wallet.price || wallet.buying || wallet.loading) &&
                styles.disabled,
            ]}
            disabled={!wallet.price || wallet.buying || wallet.loading}
            onPress={() => void wallet.purchase()}
          >
            <Text style={styles.primaryText}>
              {wallet.buying
                ? "購入処理中…"
                : wallet.price
                  ? `10ジェムを購入（${wallet.price}）`
                  : "商品情報を取得できません"}
            </Text>
          </Pressable>
          <Text style={styles.panelText}>
            お問い合わせID：{supportId(wallet.userId)}
            {"\n"}
            ジェムが減ったのにヒントや復活が届かなかった場合は、このIDを添えてサポートへご連絡ください。
          </Text>
          <Pressable
            style={styles.secondary}
            onPress={() => confirmDelete(wallet)}
          >
            <Text style={styles.secondaryText}>アカウントを削除</Text>
          </Pressable>
        </>
      )}
      {wallet.message ? (
        <Text style={styles.error}>{wallet.message}</Text>
      ) : null}
    </View>
  );
}
