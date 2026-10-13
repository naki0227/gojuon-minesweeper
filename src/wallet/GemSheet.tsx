import { useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../endless/styles";
import { GemWalletPanel } from "./GemWalletPanel";
import type { useGemWallet } from "./useGemWallet";

type Wallet = ReturnType<typeof useGemWallet>;

export const GEM_COLOR = "#4a63c9";

// A small balance chip for the game header. Tapping it opens the full
// wallet (sign-in, packs, support ID, account deletion) as a sheet, so the
// play screen stays on one screen.
export function GemChip({ wallet }: { wallet: Wallet }) {
  const [open, setOpen] = useState(false);
  if (!wallet.enabled) return null;
  // Just the balance; signing in and buying happen in the sheet.
  const label =
    wallet.userId && wallet.balance !== null
      ? wallet.balance.toLocaleString()
      : "－";
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`ジェム ${label}。タップで購入・ログイン`}
        style={styles.gemChip}
        onPress={() => setOpen(true)}
      >
        <MaterialIcons name="diamond" size={16} color={GEM_COLOR} />
        <Text style={styles.gemChipText}>{label}</Text>
        <View style={styles.gemChipPlus}>
          <MaterialIcons name="add" size={14} color="#ffffff" />
        </View>
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>ジェム</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              hitSlop={12}
            >
              <Text style={styles.sheetClose}>閉じる</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            <Text style={styles.panelText}>
              ヒント（安全マスの表示）は1ジェム、4回目以降の復活は3ジェム。
            </Text>
            <GemWalletPanel wallet={wallet} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
