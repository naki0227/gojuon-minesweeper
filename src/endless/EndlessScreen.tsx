import { useMemo, useState } from "react";
import { Linking, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Head from "expo-router/head";
import { Link, useLocalSearchParams } from "expo-router";

import { useRemoveAds } from "../purchases/RemoveAdsProvider";
import { pickRandomQuestion, questionPrompt } from "../data/questions";
import type { QuestionFilters } from "../data/types";
import { questionMineCharacters } from "../game/engine";
import {
  endEndless,
  FREE_REVIVE_LIMIT,
  grantHint,
  safeHintCandidate,
  guessEndless,
  nextEndlessQuestion,
  openEndless,
  passEndless,
  reviveEndless,
  startEndless,
  type EndlessState,
} from "./engine";
import { requestRewardedRevive } from "./rewardedRevive";
import { PlayPanel } from "./PlayPanel";
import { EndPanels } from "./EndPanels";
import { styles } from "./styles";
import { useGemWallet } from "../wallet/useGemWallet";
import { GemWalletPanel } from "../wallet/GemWalletPanel";

const DEFAULT_FILTERS: QuestionFilters = {
  language: "ja",
  categories: [],
  length: "any",
};

function parseFilters(raw: string | string[] | undefined): QuestionFilters {
  if (typeof raw !== "string") return DEFAULT_FILTERS;
  try {
    const value = JSON.parse(raw) as QuestionFilters;
    if (!["ja", "en", "any"].includes(value.language)) return DEFAULT_FILTERS;
    if (!Array.isArray(value.categories)) return DEFAULT_FILTERS;
    if (!value.categories.every((item) => typeof item === "string"))
      return DEFAULT_FILTERS;
    const validLength =
      value.length === "any" ||
      (typeof value.length === "number" && Number.isInteger(value.length)) ||
      (typeof value.length === "object" &&
        value.length !== null &&
        typeof value.length.min === "number" &&
        (value.length.max === null || typeof value.length.max === "number"));
    return validLength ? value : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function EndlessScreen() {
  const params = useLocalSearchParams<{ filters?: string }>();
  const filters = useMemo(() => parseFilters(params.filters), [params.filters]);
  const [game, setGame] = useState<EndlessState | null>(() => {
    const question = pickRandomQuestion(filters);
    return question ? startEndless(question) : null;
  });
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { owned: adsRemoved } = useRemoveAds();
  const wallet = useGemWallet();
  const [runId, setRunId] = useState(() =>
    `run_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`,
  );

  const mineChars = useMemo(
    () => (game ? questionMineCharacters(game.question) : new Set<string>()),
    [game],
  );
  const hintedChars = useMemo(() => new Set(game?.hints ?? []), [game?.hints]);

  function submit() {
    if (!game || busy || !answer.trim()) return;
    setGame(guessEndless(game, answer));
    setAnswer("");
  }

  function advance() {
    if (!game || busy || game.phase !== "cleared") return;
    const question = pickRandomQuestion(filters, game.question.id);
    if (!question) {
      setGame({
        ...game,
        phase: "finished",
        message: "出題できる問題がありません。",
      });
      return;
    }
    setGame(nextEndlessQuestion(game, question));
    setAnswer("");
  }

  async function revive() {
    if (!game || game.phase !== "revive" || busy) return;
    if (game.revives >= FREE_REVIVE_LIMIT) return;
    setBusy(true);
    setError(null);
    try {
      // The Web version has no rewarded ad integration yet; keep its
      // first three revives free instead of pretending to play an ad.
      const granted =
        adsRemoved || Platform.OS === "web" || (await requestRewardedRevive());
      if (granted)
        setGame((current) => (current ? reviveEndless(current) : current));
      else setError("広告を視聴できませんでした。時間をおいて試してください。");
    } catch {
      setError("広告の読み込みに失敗しました。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  async function paidRevive() {
    if (!game || game.phase !== "revive" || busy ||
      game.revives < FREE_REVIVE_LIMIT) return;
    setBusy(true);
    setError(null);
    try {
      await wallet.spend("revive", `${runId}:revive:${game.revives}`);
      setGame((current) => current ? reviveEndless(current) : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "復活できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  async function hint() {
    if (!game || busy || !safeHintCandidate(game)) return;
    setBusy(true);
    setError(null);
    try {
      await wallet.spend(
        "hint", `${runId}:hint:${game.question.id}:${game.hintUses}`,
      );
      setGame((current) => current ? grantHint(current) : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ヒントを取得できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!game) return;
    const message = [
      "五十音マインスイーパー ENDLESS",
      `${game.score}点 / ${game.solved}問正解`,
      `開いた数 ${game.totalOpenedMoves}・地雷 ${game.totalMineHits}・復活 ${game.revives}回`,
      "#五十音マインスイーパー",
    ].join("\n");
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent("https://minesweeper.enludus.com/")}`;
    try {
      await Linking.openURL(url);
    } catch {
      setError("Xの投稿画面を開けませんでした。");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Head>
        <title>エンドレスモード | 五十音マインスイーパー</title>
        <meta
          name="description"
          content="ライフ3つで言葉を解き続けるソロモード。少ない手数で高得点を目指そう。"
        />
      </Head>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <View style={styles.top}>
          <View>
            <Text style={styles.eyebrow}>SOLO / ENDLESS</Text>
            <Text style={styles.title}>推理サバイバル</Text>
          </View>
          <Link href="/" style={styles.exit}>
            ホームへ
          </Link>
        </View>

        {game ? (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statCaption}>スコア</Text>
                <Text style={styles.statValue}>
                  {game.score.toLocaleString()}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statCaption}>クリア</Text>
                <Text style={styles.statValue}>{game.solved}問</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statCaption}>ライフ</Text>
                <Text style={styles.statValue}>
                  {"♥".repeat(game.lives)}
                  {"♡".repeat(3 - game.lives)}
                </Text>
              </View>
            </View>
            <GemWalletPanel wallet={wallet} />
            <Text style={styles.prompt}>{questionPrompt(game.question)}</Text>
            <Text style={styles.help}>
              少ない手数・少ない被弾で正解しよう。安全な0マスの連鎖はボーナス！
            </Text>
            <View style={styles.message}>
              <Text style={styles.messageText}>{game.message}</Text>
              {game.lastChainBonus > 0 && game.phase === "answer" ? (
                <Text style={styles.chain}>CHAIN +{game.lastChainBonus}点</Text>
              ) : null}
            </View>

            <PlayPanel
              game={game}
              answer={answer}
              onChangeAnswer={setAnswer}
              onSubmit={submit}
              onPass={() => { if (!busy) setGame(passEndless(game)); }}
              onOpen={(char) =>
                !busy && setGame((current) =>
                  current ? openEndless(current, char) : current,
                )
              }
              mineChars={mineChars}
              hintedChars={hintedChars}
              busy={busy}
              gemBalance={wallet.balance}
              onHint={() => void hint()}
            />
            <EndPanels
              game={game}
              busy={busy}
              adsRemoved={adsRemoved}
              onAdvance={advance}
              onRevive={() => void revive()}
              onPaidRevive={() => void paidRevive()}
              gemBalance={wallet.balance}
              onFinish={() => setGame(endEndless(game))}
              onShare={() => void share()}
              onRestart={() => {
                const question = pickRandomQuestion(filters);
                if (question) {
                  setGame(startEndless(question));
                  setRunId(`run_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`);
                }
              }}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.micro}>
              開いたマス {game.totalOpenedMoves} / 地雷 {game.totalMineHits} /
              復活 {game.revives}
            </Text>
          </>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>
              この条件では問題が見つかりませんでした。
            </Text>
            <Link href="/" style={styles.exit}>
              条件を選び直す
            </Link>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
