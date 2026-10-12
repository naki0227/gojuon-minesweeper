import { useMemo, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Head from "expo-router/head";
import { Link, useLocalSearchParams } from "expo-router";

import { CharacterBoard } from "../components/CharacterBoard";
import { useRemoveAds } from "../purchases/RemoveAdsProvider";
import { pickRandomQuestion, questionPrompt, primaryAnswer } from "../data/questions";
import type { QuestionFilters } from "../data/types";
import { adjacentMineCount, questionMineCharacters, questionMineMultiplicity } from "../game/engine";
import {
  endEndless,
  FREE_REVIVE_LIMIT,
  guessEndless,
  nextEndlessQuestion,
  openEndless,
  passEndless,
  reviveEndless,
  startEndless,
  type EndlessState,
} from "./engine";
import { requestRewardedRevive } from "./rewardedRevive";
import { styles } from "./styles";

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
    if (!value.categories.every((item) => typeof item === "string")) return DEFAULT_FILTERS;
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

  const mineChars = useMemo(
    () => (game ? questionMineCharacters(game.question) : new Set<string>()),
    [game],
  );
  const hintedChars = useMemo(() => new Set(game?.hints ?? []), [game?.hints]);

  function submit() {
    if (!game || !answer.trim()) return;
    setGame(guessEndless(game, answer));
    setAnswer("");
  }

  function advance() {
    if (!game || game.phase !== "cleared") return;
    const question = pickRandomQuestion(filters, game.question.id);
    if (!question) {
      setGame({ ...game, phase: "finished", message: "出題できる問題がありません。" });
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
      if (granted) setGame((current) => (current ? reviveEndless(current) : current));
      else setError("広告を視聴できませんでした。時間をおいて試してください。");
    } catch {
      setError("広告の読み込みに失敗しました。もう一度お試しください。");
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
        <meta name="description" content="ライフ3つで言葉を解き続けるソロモード。少ない手数で高得点を目指そう。" />
      </Head>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <View style={styles.top}>
          <View>
            <Text style={styles.eyebrow}>SOLO / ENDLESS</Text>
            <Text style={styles.title}>推理サバイバル</Text>
          </View>
          <Link href="/" style={styles.exit}>ホームへ</Link>
        </View>

        {game ? (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}><Text style={styles.statCaption}>スコア</Text><Text style={styles.statValue}>{game.score.toLocaleString()}</Text></View>
              <View style={styles.stat}><Text style={styles.statCaption}>クリア</Text><Text style={styles.statValue}>{game.solved}問</Text></View>
              <View style={styles.stat}><Text style={styles.statCaption}>ライフ</Text><Text style={styles.statValue}>{"♥".repeat(game.lives)}{"♡".repeat(3 - game.lives)}</Text></View>
            </View>
            <Text style={styles.prompt}>{questionPrompt(game.question)}</Text>
            <Text style={styles.help}>少ない手数・少ない被弾で正解しよう。安全な0マスの連鎖はボーナス！</Text>
            <View style={styles.message}>
              <Text style={styles.messageText}>{game.message}</Text>
              {game.lastChainBonus > 0 && game.phase === "answer" ? (
                <Text style={styles.chain}>CHAIN +{game.lastChainBonus}点</Text>
              ) : null}
            </View>

            {game.phase === "answer" || game.phase === "open" ? (
              <>
                <TextInput
                  accessibilityLabel="答えを入力"
                  style={styles.input}
                  placeholder={game.phase === "answer" ? "答えを入力" : "1マス開いてください"}
                  value={answer}
                  editable={game.phase === "answer"}
                  onChangeText={setAnswer}
                  onSubmitEditing={submit}
                />
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.primary, (game.phase !== "answer" || !answer.trim()) && styles.disabled]}
                    disabled={game.phase !== "answer" || !answer.trim()}
                    onPress={submit}
                  ><Text style={styles.primaryText}>回答する</Text></Pressable>
                  <Pressable
                    style={[styles.secondary, game.phase !== "answer" && styles.disabled]}
                    disabled={game.phase !== "answer"}
                    onPress={() => setGame(passEndless(game))}
                  ><Text style={styles.secondaryText}>回答せず開く</Text></Pressable>
                </View>
                <CharacterBoard
                  language={game.question.language}
                  openedChars={game.opened}
                  hintedChars={hintedChars}
                  mineChars={mineChars}
                  mineCount={(char) => adjacentMineCount(game.question, char)}
                  mineMultiplicity={(char) => questionMineMultiplicity(game.question, char)}
                  canOpen={game.phase === "open"}
                  onOpen={(char) => setGame((current) => current ? openEndless(current, char) : current)}
                />
                <Text style={styles.micro}>ヒント：緑色のマスは安全。タップした時に初めて数字が分かります。</Text>
                <View style={styles.notice}>
                  <Text style={styles.noticeTitle}>ジェムのヒント（1個）</Text>
                  <Text style={styles.noticeText}>安全な未開封マスを1つ表示。購入・残高同期の実装後に有効になります。</Text>
                </View>
              </>
            ) : null}

            {game.phase === "cleared" ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>正解！</Text>
                <Text style={styles.answer}>{game.question.answers.map((a) => a.display).join(" / ")}</Text>
                <Text style={styles.panelText}>次の問題へ進むとスコアを引き継ぎます。</Text>
                <Pressable style={styles.primary} onPress={advance}><Text style={styles.primaryText}>次の問題へ</Text></Pressable>
              </View>
            ) : null}

            {game.phase === "revive" ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>ライフが0になった！</Text>
                <Text style={styles.panelText}>復活するとライフが2つ戻り、安全な1マスが緑色に表示されます。</Text>
                {game.revives < FREE_REVIVE_LIMIT ? (
                  <Pressable style={styles.primary} disabled={busy} onPress={() => void revive()}>
                    <Text style={styles.primaryText}>{busy ? "広告を準備中..." : adsRemoved || Platform.OS === "web" ? "無料で復活する" : "広告を見て復活する"}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.notice}>
                    <Text style={styles.noticeTitle}>4回目以降：3ジェム</Text>
                    <Text style={styles.noticeText}>現在はジェム決済の準備中です。記録を確定してください。</Text>
                  </View>
                )}
                <Pressable style={styles.secondary} onPress={() => setGame(endEndless(game))}>
                  <Text style={styles.secondaryText}>復活せず記録を確定</Text>
                </Pressable>
              </View>
            ) : null}

            {game.phase === "finished" ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>ゲームオーバー</Text>
                <Text style={styles.bigScore}>{game.score.toLocaleString()}点</Text>
                <Text style={styles.panelText}>{game.solved}問正解 / 開いた回数 {game.totalOpenedMoves} / 地雷 {game.totalMineHits} / 復活 {game.revives}</Text>
                <Pressable style={styles.primary} onPress={() => void share()}>
                  <Text style={styles.primaryText}>Xで記録をシェア</Text>
                </Pressable>
                <Pressable style={styles.secondary} onPress={() => {
                  const question = pickRandomQuestion(filters);
                  if (question) setGame(startEndless(question));
                }}><Text style={styles.secondaryText}>最初から遊ぶ</Text></Pressable>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.micro}>開いたマス {game.totalOpenedMoves} / 地雷 {game.totalMineHits} / 復活 {game.revives}</Text>
          </>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>この条件では問題が見つかりませんでした。</Text>
            <Link href="/" style={styles.exit}>条件を選び直す</Link>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
