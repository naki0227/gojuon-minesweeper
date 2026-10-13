import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Popup } from "../components/Popup";
import { styles } from "../endless/styles";
import { GemWalletPanel } from "./GemWalletPanel";
import { walletStyles } from "./styles";
import type { useGemWallet } from "./useGemWallet";
import { colors } from "../theme/colors";
import { Pressable } from "../components/TapPressable";

type Wallet = ReturnType<typeof useGemWallet>;

// A small balance chip for the game header. Tapping it opens the wallet
// (sign-in, packs, support ID, account deletion) as a popup over the game,
// so the play screen stays on one screen.
export function GemChip({ wallet }: { wallet: Wallet }) {
  const [open, setOpen] = useState(false);
  if (!wallet.enabled) return null;
  // Just the balance; signing in and buying happen in the popup.
  const label =
    wallet.userId && wallet.balance !== null
      ? wallet.balance.toLocaleString()
      : "－";
  const close = () => setOpen(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`ジェム ${label}。タップで購入・ログイン`}
        style={styles.gemChip}
        onPress={() => setOpen(true)}
      >
        <MaterialIcons name="diamond" size={16} color={colors.gem} />
        <Text style={styles.gemChipText}>{label}</Text>
        <View style={styles.gemChipPlus}>
          <MaterialIcons name="add" size={14} color={colors.white} />
        </View>
      </Pressable>
      <Popup visible={open} onDismiss={close}>
        <View style={walletStyles.header}>
          <Text style={walletStyles.title}>ジェム</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="閉じる"
            onPress={close}
            hitSlop={12}
          >
            <MaterialIcons name="close" size={22} color="#546d7a" />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={walletStyles.body}>
          <GemWalletPanel wallet={wallet} />
        </ScrollView>
      </Popup>
    </>
  );
}
