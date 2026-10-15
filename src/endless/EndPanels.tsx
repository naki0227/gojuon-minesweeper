import { Platform, Text, View } from "react-native";

import { FREE_REVIVE_LIMIT, type EndlessState } from "./engine";
import { styles } from "./styles";
import { tr } from "../i18n";
import { Pressable } from "../components/TapPressable";

const S = tr({
  ja: {
    correct: "正解！",
    carryOver: "次の問題へ進むとスコアを引き継ぎます。",
    next: "次の問題へ",
    noLives: "ライフが0になった！",
    reviveHelp: "復活するとライフが2つ戻り、安全な1マスが緑色に表示されます。",
    loadingAd: "広告を準備中...",
    freeRevive: "無料で復活する",
    adRevive: "広告を見て復活する",
    gemRevive: (balance: number | null) =>
      `3ジェムで復活する（残高 ${balance ?? "未同期"}）`,
    finish: "復活せず記録を確定",
    gameOver: "ゲームオーバー",
    points: (score: number) => `${score.toLocaleString()}点`,
    summary: (game: EndlessState) =>
      `${game.solved}問正解 / 開いた回数 ${game.totalOpenedMoves} / 地雷 ${game.totalMineHits} / 復活 ${game.revives}`,
    share: "Xで記録をシェア",
    restart: "最初から遊ぶ",
  },
  en: {
    correct: "Correct!",
    carryOver: "Your score carries over to the next question.",
    next: "Next question",
    noLives: "Out of lives!",
    reviveHelp: "Revive to get 2 lives back and see one safe cell in green.",
    loadingAd: "Loading ad...",
    freeRevive: "Revive for free",
    adRevive: "Watch an ad to revive",
    gemRevive: (balance: number | null) =>
      `Revive for 3 gems (you have ${balance ?? "not synced"})`,
    finish: "Don't revive, save my score",
    gameOver: "Game over",
    points: (score: number) => `${score.toLocaleString()} pts`,
    summary: (game: EndlessState) =>
      `${game.solved} solved / ${game.totalOpenedMoves} opens / ${game.totalMineHits} mines / ${game.revives} revives`,
    share: "Share on X",
    restart: "Play again",
  },
});

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
          <Text style={styles.panelTitle}>{S.correct}</Text>
          <Text style={styles.answer}>
            {game.question.answers.map((a) => a.display).join(" / ")}
          </Text>
          <Text style={styles.panelText}>{S.carryOver}</Text>
          <Pressable style={styles.primary} onPress={onAdvance}>
            <Text style={styles.primaryText}>{S.next}</Text>
          </Pressable>
        </View>
      ) : null}
      {game.phase === "revive" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{S.noLives}</Text>
          <Text style={styles.panelText}>{S.reviveHelp}</Text>
          {game.revives < FREE_REVIVE_LIMIT ? (
            <Pressable
              style={styles.primary}
              disabled={busy}
              onPress={onRevive}
            >
              <Text style={styles.primaryText}>
                {busy
                  ? S.loadingAd
                  : adsRemoved || Platform.OS === "web"
                    ? S.freeRevive
                    : S.adRevive}
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
              <Text style={styles.primaryText}>{S.gemRevive(gemBalance)}</Text>
            </Pressable>
          )}
          <Pressable style={styles.secondary} onPress={onFinish}>
            <Text style={styles.secondaryText}>{S.finish}</Text>
          </Pressable>
        </View>
      ) : null}
      {game.phase === "finished" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{S.gameOver}</Text>
          <Text style={styles.bigScore}>{S.points(game.score)}</Text>
          <Text style={styles.panelText}>{S.summary(game)}</Text>
          <Pressable style={styles.primary} onPress={onShare}>
            <Text style={styles.primaryText}>{S.share}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onRestart}>
            <Text style={styles.secondaryText}>{S.restart}</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
