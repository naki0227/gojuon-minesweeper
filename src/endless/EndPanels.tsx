import { Platform, Text, View } from "react-native";

import { FREE_REVIVE_LIMIT, type EndlessState } from "./engine";
import { styles } from "./styles";
import { Pressable } from "../components/TapPressable";

type Props = {
  game: EndlessState;
  busy: boolean;
  adsRemoved: boolean;
  onAdvance: () => void;
  onRevive: () => void;
  onPaidRevive: () => void;
  gemBalance: number | null;
  onFinish: () => void;
  onShare: () => void;
  onRestart: () => void;
};

export function EndPanels({
  game,
  busy,
  adsRemoved,
  onAdvance,
  onRevive,
  onPaidRevive,
  gemBalance,
  onFinish,
  onShare,
  onRestart,
}: Props) {
  return (
    <>
      {game.phase === "cleared" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>正解！</Text>
          <Text style={styles.answer}>
            {game.question.answers.map((a) => a.display).join(" / ")}
          </Text>
          <Text style={styles.panelText}>
            次の問題へ進むとスコアを引き継ぎます。
          </Text>
          <Pressable style={styles.primary} onPress={onAdvance}>
            <Text style={styles.primaryText}>次の問題へ</Text>
          </Pressable>
        </View>
      ) : null}
      {game.phase === "revive" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>ライフが0になった！</Text>
          <Text style={styles.panelText}>
            復活するとライフが2つ戻り、安全な1マスが緑色に表示されます。
          </Text>
          {game.revives < FREE_REVIVE_LIMIT ? (
            <Pressable
              style={styles.primary}
              disabled={busy}
              onPress={onRevive}
            >
              <Text style={styles.primaryText}>
                {busy
                  ? "広告を準備中..."
                  : adsRemoved || Platform.OS === "web"
                    ? "無料で復活する"
                    : "広告を見て復活する"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.primary,
                (busy || gemBalance === null || gemBalance < 3) &&
                  styles.disabled,
              ]}
              disabled={busy || gemBalance === null || gemBalance < 3}
              onPress={onPaidRevive}
            >
              <Text style={styles.primaryText}>
                3ジェムで復活する（残高 {gemBalance ?? "未同期"}）
              </Text>
            </Pressable>
          )}
          <Pressable style={styles.secondary} onPress={onFinish}>
            <Text style={styles.secondaryText}>復活せず記録を確定</Text>
          </Pressable>
        </View>
      ) : null}
      {game.phase === "finished" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>ゲームオーバー</Text>
          <Text style={styles.bigScore}>{game.score.toLocaleString()}点</Text>
          <Text style={styles.panelText}>
            {game.solved}問正解 / 開いた回数 {game.totalOpenedMoves} / 地雷{" "}
            {game.totalMineHits} / 復活 {game.revives}
          </Text>
          <Pressable style={styles.primary} onPress={onShare}>
            <Text style={styles.primaryText}>Xで記録をシェア</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onRestart}>
            <Text style={styles.secondaryText}>最初から遊ぶ</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
