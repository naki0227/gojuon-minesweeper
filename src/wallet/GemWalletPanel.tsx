import { Pressable, Text, View } from "react-native";
import { AppleAccount } from "./AppleAccount";
import { styles } from "../endless/styles";
import { useGemWallet } from "./useGemWallet";

type Wallet = ReturnType<typeof useGemWallet>;

export function GemWalletPanel({ wallet }: { wallet: Wallet }) {
  if (!wallet.enabled) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.noticeTitle}>ジェム</Text>
      {!wallet.userId ? (
        <>
          <Text style={styles.panelText}>
            Appleでログインすると、購入したジェムを再インストール後も復元できます。
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
        </>
      )}
      {wallet.message ? (
        <Text style={styles.error}>{wallet.message}</Text>
      ) : null}
    </View>
  );
}
