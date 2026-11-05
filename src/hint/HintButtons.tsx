import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { REWARDED_SUPPORTED, requestRewardedAd } from "../ads/rewarded";
import { Pressable } from "../components/TapPressable";
import { useAdFree } from "../entitlements/useAdFree";
import { tr } from "../i18n";
import { colors } from "../theme/colors";
import { GemWalletPopup } from "../wallet/GemSheet";
import { useGemWallet } from "../wallet/useGemWallet";

const S = tr({
  ja: {
    free: "💡 ヒント（1回目は無料）",
    video: "🎬 動画で無料",
    gem: (balance: number | null) =>
      `💎1 で使う${balance === null ? "" : `（残り${balance}）`}`,
    what: "安全なマスを1つ光らせます",
    loading: "準備中…",
    noVideo: "いまは動画を出せませんでした。少し待ってもう一度どうぞ。",
    gemFailed: "ジェムを使えませんでした。",
  },
  en: {
    free: "💡 Hint (the first is free)",
    video: "🎬 Free with a video",
    gem: (balance: number | null) =>
      `Use 💎1${balance === null ? "" : ` (${balance} left)`}`,
    what: "Lights up one safe cell",
    loading: "Getting ready…",
    noVideo: "No video right now. Try again in a moment.",
    gemFailed: "Couldn't use a gem.",
  },
});

// The hint in the solo modes and the bot match. The first hint of each
// game is free; after that it is a rewarded video or one gem, like the
// endless hint. Remove Ads owners pay with a gem only, so their hints
// are never unlimited.
export function HintButtons({
  used,
  actionKey,
  note,
  onHint,
}: {
  // Hints already used in this game.
  used: number;
  // Names this game and hint for the gem spend (made safe below).
  actionKey: string;
  // Extra line, such as what a hint costs in stars.
  note?: string;
  onHint: () => void;
}) {
  const { resolved, adFree } = useAdFree();
  const wallet = useGemWallet();
  const [nonce] = useState(() => Math.random().toString(36).slice(2, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const video = resolved && !adFree && REWARDED_SUPPORTED;
  const gems = wallet.enabled;
  if (used > 0 && !video && !gems) return null;

  async function watch() {
    setBusy(true);
    setError(null);
    const earned = await requestRewardedAd().catch(() => false);
    setBusy(false);
    if (earned) onHint();
    else setError(S.noVideo);
  }

  async function spend() {
    if (!wallet.userId || wallet.balance === null || wallet.balance < 1) {
      setWalletOpen(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await wallet.spend(
        "hint",
        `h:${nonce}:${actionKey}`
          .replace(/[^a-zA-Z0-9:_-]/g, "_")
          .slice(0, 120),
      );
      onHint();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : S.gemFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {used === 0 ? (
          <Choice label={S.free} disabled={busy} onPress={onHint} />
        ) : (
          <>
            {video ? (
              <Choice
                label={busy ? S.loading : S.video}
                disabled={busy}
                onPress={() => void watch()}
              />
            ) : null}
            {gems ? (
              <Choice
                label={S.gem(wallet.userId ? wallet.balance : null)}
                disabled={busy}
                onPress={() => void spend()}
              />
            ) : null}
          </>
        )}
      </View>
      <Text style={[styles.note, error && styles.error]}>
        {error ?? (note ? `${S.what}（${note}）` : S.what)}
      </Text>
      {gems ? (
        <GemWalletPopup
          wallet={wallet}
          visible={walletOpen}
          onDismiss={() => setWalletOpen(false)}
        />
      ) : null}
    </View>
  );
}

function Choice({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.busy]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 4 },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  button: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  busy: { opacity: 0.6 },
  label: { color: colors.inkSoft, fontSize: 15, fontWeight: "800" },
  note: { color: colors.muted, fontSize: 12, textAlign: "center" },
  error: { color: colors.danger },
});
