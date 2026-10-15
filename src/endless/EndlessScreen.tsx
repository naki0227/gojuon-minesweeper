import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Head from "expo-router/head";
import { Link, useLocalSearchParams } from "expo-router";

import { useRemoveAds } from "../purchases/RemoveAdsProvider";
import { pickRandomQuestion } from "../data/questions";
import { promptText } from "../i18n/text";
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
import { stingerFor } from "./pauses";
import { Stinger } from "./Stinger";
import { styles } from "./styles";
import { ENDLESS_SCREEN_TEXT as S } from "./EndlessScreen.strings";
import { parseFilters } from "../data/filters";
import { useGemWallet } from "../wallet/useGemWallet";
import { EndlessHud } from "./Hud";
import { noteWinForReview } from "../review/askForReview";
import { endlessSnapshot, useTransitionSounds } from "../sound/snapshots";

export function EndlessScreen() {
  const params = useLocalSearchParams<{ filters?: string }>();
  const filters = useMemo(() => parseFilters(params.filters), [params.filters]);
  const [game, setGame] = useState<EndlessState | null>(() => {
    const question = pickRandomQuestion(filters);
    return question ? startEndless(question) : null;
  });
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const actionInFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const { owned: adsRemoved } = useRemoveAds();
  const wallet = useGemWallet();
  const [runId, setRunId] = useState(
    () => `run_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`,
  );

  const mineChars = useMemo(
    () => (game ? questionMineCharacters(game.question) : new Set<string>()),
    [game],
  );
  // The key of the last start/clear/game-over pause the player tapped away.
  const [seenStinger, setSeenStinger] = useState<string | null>(null);
  const stinger = game ? stingerFor(game) : null;
  useTransitionSounds(endlessSnapshot(game));
  const hintedChars = useMemo(() => new Set(game?.hints ?? []), [game?.hints]);

  function submit() {
    if (!game || busy || actionInFlight.current || !answer.trim()) return;
    setGame(guessEndless(game, answer));
    setAnswer("");
  }

  function advance() {
    if (!game || busy || actionInFlight.current || game.phase !== "cleared")
      return;
    void noteWinForReview();
    const question = pickRandomQuestion(filters, game.question.id);
    if (!question) {
      setGame({
        ...game,
        phase: "finished",
        message: S.noQuestions,
      });
      return;
    }
    setGame(nextEndlessQuestion(game, question));
    setAnswer("");
  }

  async function revive() {
    if (!game || game.phase !== "revive" || busy || actionInFlight.current)
      return;
    if (game.revives >= FREE_REVIVE_LIMIT) return;
    actionInFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      // The Web version has no rewarded ad integration yet; keep its
      // first three revives free instead of pretending to play an ad.
      const granted =
        adsRemoved || Platform.OS === "web" || (await requestRewardedRevive());
      if (granted)
        setGame((current) => (current ? reviveEndless(current) : current));
      else setError(S.adNotWatched);
    } catch {
      setError(S.adFailed);
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  }

  async function paidRevive() {
    if (
      !game ||
      game.phase !== "revive" ||
      busy ||
      actionInFlight.current ||
      game.revives < FREE_REVIVE_LIMIT
    )
      return;
    actionInFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await wallet.spend("revive", `${runId}:revive:${game.revives}`);
      setGame((current) => (current ? reviveEndless(current) : current));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : S.reviveFailed);
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  }

  async function hint() {
    if (!game || busy || actionInFlight.current || !safeHintCandidate(game))
      return;
    actionInFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await wallet.spend(
        "hint",
        `${runId}:hint:${game.question.id}:${game.hintUses}`,
      );
      setGame((current) =>
        current &&
        current.question.id === game.question.id &&
        current.hintUses === game.hintUses
          ? grantHint(current)
          : current,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : S.hintFailed);
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  }

  async function share() {
    if (!game) return;
    const message = S.shareLines(game).join("\n");
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent("https://minesweeper.enludus.com/")}`;
    try {
      await Linking.openURL(url);
    } catch {
      setError(S.shareFailed);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Head>
        <title>{S.pageTitle}</title>
        <meta name="description" content={S.pageDescription} />
      </Head>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.page}
        >
          <EndlessHud game={game} wallet={wallet} />

          {game ? (
            <>
              <Text style={styles.prompt}>{promptText(game.question)}</Text>
              <View style={styles.message}>
                <Text style={styles.messageText} numberOfLines={2}>
                  {game.message}
                </Text>
                {game.lastChainBonus > 0 && game.phase === "answer" ? (
                  <Text style={styles.chain}>
                    {S.chain(game.lastChainBonus)}
                  </Text>
                ) : null}
              </View>

              {stinger && stinger.key !== seenStinger ? (
                <Stinger
                  game={game}
                  kind={stinger.kind}
                  mineChars={mineChars}
                  hintedChars={hintedChars}
                  onContinue={() => setSeenStinger(stinger.key)}
                />
              ) : (
                <>
                  <PlayPanel
                    game={game}
                    answer={answer}
                    onChangeAnswer={setAnswer}
                    onSubmit={submit}
                    onPass={() => {
                      if (!busy && !actionInFlight.current)
                        setGame(passEndless(game));
                    }}
                    onOpen={(char) =>
                      !busy &&
                      !actionInFlight.current &&
                      setGame((current) =>
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
                        setRunId(
                          `run_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`,
                        );
                      }
                    }}
                  />
                </>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </>
          ) : (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{S.noMatch}</Text>
              <Link href="/" style={styles.panelLink}>
                {S.changeFilters}
              </Link>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
