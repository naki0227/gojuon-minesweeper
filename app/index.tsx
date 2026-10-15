import { useMemo, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { PinnedBannerScreen } from "../src/ads/PinnedBannerScreen";
import { matchBanner } from "../src/ads/types";
import { trackEvent } from "../src/analytics/events";
import { CharacterBoard } from "../src/components/CharacterBoard";
import { RuleHelp } from "../src/components/RuleHelp";
import { Confetti } from "../src/components/Confetti";
import { PopIn } from "../src/components/PopIn";
import { USE_NATIVE_DRIVER, useReducedMotion } from "../src/components/motion";
import { HomeSetup } from "../src/components/HomeSetup";
import { LOCAL_MATCH_TEXT as S } from "../src/components/LocalMatch.strings";
import { LOCALE } from "../src/i18n";
import { gameMessage, promptText } from "../src/i18n/text";
import { isOnlineConfigured } from "../src/online/client";
import { pickRandomQuestion } from "../src/data/questions";
import type { QuestionFilters } from "../src/data/types";
import {
  adjacentMineCount,
  answerHint,
  createInitialState,
  isMineCharacter,
  openCharacter,
  passAnswer,
  questionMineCharacters,
  questionMineMultiplicity,
  submitAnswer,
  type GameState,
} from "../src/game/engine";
import { matchStyles } from "../src/components/matchStyles";
import { colors } from "../src/theme/colors";
import { buttonStyles } from "../src/components/buttonStyles";
import { noteWinForReview } from "../src/review/askForReview";
import { localSnapshot } from "../src/sound/snapshots";
import { playSound } from "../src/sound/sounds";
import { transitionSound } from "../src/sound/transitions";
import { Pressable } from "../src/components/TapPressable";

const INITIAL_FILTERS: QuestionFilters = {
  language: LOCALE === "en" ? "en" : "ja",
  categories: [],
  length: "any",
};

export default function HomeScreen() {
  const [filters, setFilters] = useState<QuestionFilters>(INITIAL_FILTERS);
  const [game, setGame] = useState<GameState | null>(null);
  const [answer, setAnswer] = useState("");
  const reducedMotion = useReducedMotion();
  const wrongShake = useState(() => new Animated.Value(0))[0];

  const mineChars = useMemo(
    () => (game ? questionMineCharacters(game.question) : new Set<string>()),
    [game],
  );

  function startGame(nextFilters: QuestionFilters, excludeId?: string) {
    const question = pickRandomQuestion(nextFilters, excludeId);

    if (!question) {
      return;
    }

    setFilters(nextFilters);
    setGame(createInitialState(question));
    setAnswer("");

    trackEvent("game_start", {
      question_id: question.id,
      language: question.language,
      category: question.category,
      answer_length: question.length,
    });
  }

  if (!game) {
    return (
      <>
        <HomeSetup
          filters={filters}
          onChangeFilters={setFilters}
          onStart={(nextFilters) => startGame(nextFilters)}
          onOnline={
            isOnlineConfigured
              ? (nextFilters) =>
                  router.push({
                    pathname: "/online",
                    params: { filters: JSON.stringify(nextFilters) },
                  })
              : undefined
          }
        />
      </>
    );
  }

  const currentPlayerLabel = `Player ${game.currentPlayer + 1}`;
  const canAnswer = game.phase === "answer";
  const canOpen = game.phase === "open";

  function updateGame(previous: GameState, next: GameState) {
    if (previous.phase !== "finished" && next.phase === "finished") {
      trackEvent("game_finish", {
        question_id: previous.question.id,
        winner: next.winner === null ? "draw" : next.winner + 1,
      });
      if (next.winner !== null) void noteWinForReview();
    }
    playSound(transitionSound(localSnapshot(previous), localSnapshot(next)));
    setGame(next);
  }

  function handleSubmitAnswer() {
    if (!game) {
      return;
    }

    const next = submitAnswer(game, answer);
    const correct = next.winner !== null;

    trackEvent("answer_submit", {
      question_id: game.question.id,
      player: game.currentPlayer + 1,
    });
    trackEvent(correct ? "answer_correct" : "answer_wrong", {
      question_id: game.question.id,
      player: game.currentPlayer + 1,
    });

    updateGame(game, next);
    setAnswer("");

    if (!correct && !reducedMotion) {
      wrongShake.setValue(0);
      Animated.timing(wrongShake, {
        toValue: 1,
        duration: 420,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    }
  }

  function handlePassAnswer() {
    if (!game) {
      return;
    }

    updateGame(game, passAnswer(game));
    setAnswer("");
  }

  function handleOpen(char: string) {
    if (!game) {
      return;
    }

    const mine = isMineCharacter(game.question, char);

    trackEvent("cell_open", {
      question_id: game.question.id,
      char,
      player: game.currentPlayer + 1,
    });

    if (mine) {
      trackEvent("mine_hit", {
        question_id: game.question.id,
        char,
        player: game.currentPlayer + 1,
      });
    }

    updateGame(game, openCharacter(game, char));
  }

  const answerPlaceholder = S.placeholder(game.question.language);

  return (
    <SafeAreaView style={styles.safeArea}>
      <PinnedBannerScreen
        banner={matchBanner(game.phase)}
        layoutKey={game.question.id}
        contentStyle={styles.page}
      >
        <View style={styles.gameTopBar}>
          <Text style={styles.prompt}>{promptText(game.question)}</Text>
          <Pressable onPress={() => setGame(null)} style={styles.changeButton}>
            <Text style={styles.changeButtonText}>{S.changeSettings}</Text>
          </Pressable>
        </View>
        <RuleHelp />

        <View
          style={[styles.turnPanel, game.currentPlayer === 1 && styles.turnP2]}
        >
          <View style={styles.turnWho}>
            <Text style={styles.turnCaption}>{S.turn}</Text>
            <Text
              style={[
                styles.turnPlayer,
                game.currentPlayer === 1 && styles.turnPlayerP2,
              ]}
            >
              {currentPlayerLabel}
            </Text>
          </View>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>
              {game.phase === "finished"
                ? S.phaseFinished
                : canAnswer
                  ? S.phaseAnswer
                  : S.phaseOpen}
            </Text>
          </View>
        </View>

        <View style={styles.messagePanel}>
          <Text style={styles.message}>{gameMessage(game)}</Text>
        </View>

        {game.revealedAnswerChars > 0 && game.phase !== "finished" ? (
          <View style={styles.messagePanel}>
            <Text style={styles.message}>{S.answerHint(answerHint(game))}</Text>
          </View>
        ) : null}

        {game.phase === "finished" ? (
          <PopIn style={styles.resultPanel}>
            <Text style={styles.resultTitle}>
              {game.winner === null ? S.draw : S.win(game.winner + 1)}
            </Text>
            <Text style={styles.resultAnswer}>
              {S.answer(
                game.question.answers.map((item) => item.display).join(" / "),
              )}
            </Text>
            {game.question.answers.length > 1 ? (
              <Text style={styles.helperText}>{S.sameLetters}</Text>
            ) : null}
            <View style={styles.answerActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => startGame(filters, game.question.id)}
              >
                <Text style={styles.primaryButtonText}>{S.rematch}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setGame(null)}
              >
                <Text style={styles.secondaryButtonText}>
                  {S.changeSettings}
                </Text>
              </Pressable>
            </View>
          </PopIn>
        ) : (
          <>
            <Animated.View
              style={[
                styles.answerArea,
                {
                  transform: [
                    {
                      translateX: wrongShake.interpolate({
                        inputRange: [0, 0.15, 0.35, 0.55, 0.75, 1],
                        outputRange: [0, -12, 10, -7, 4, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TextInput
                accessibilityLabel={S.answerLabel}
                autoCapitalize="none"
                autoCorrect={false}
                editable={canAnswer}
                enterKeyHint="done"
                onChangeText={setAnswer}
                onSubmitEditing={
                  canAnswer && answer.trim() ? handleSubmitAnswer : undefined
                }
                placeholder={canAnswer ? answerPlaceholder : S.cannotAnswer}
                returnKeyType="done"
                style={[styles.input, !canAnswer ? styles.inputDisabled : null]}
                value={answer}
              />
              <View style={styles.answerActions}>
                <Pressable
                  silent
                  disabled={!canAnswer || !answer.trim()}
                  onPress={handleSubmitAnswer}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    !canAnswer || !answer.trim() ? styles.disabledButton : null,
                    pressed ? styles.pressedButton : null,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>{S.submit}</Text>
                </Pressable>
                <Pressable
                  disabled={!canAnswer}
                  onPress={handlePassAnswer}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    !canAnswer ? styles.disabledButton : null,
                    pressed ? styles.pressedButton : null,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>{S.pass}</Text>
                </Pressable>
              </View>
            </Animated.View>

            <CharacterBoard
              language={game.question.language}
              canOpen={canOpen}
              mineChars={mineChars}
              mineCount={(char) => adjacentMineCount(game.question, char)}
              mineMultiplicity={(char) =>
                questionMineMultiplicity(game.question, char)
              }
              onOpen={handleOpen}
              openedChars={game.openedChars}
            />
          </>
        )}
      </PinnedBannerScreen>
      {game.winner !== null && !reducedMotion ? (
        <Confetti key={game.question.id} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = {
  ...matchStyles,
  ...StyleSheet.create({
    page: {
      width: "100%",
      maxWidth: 760,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
      gap: 10,
    },
    prompt: {
      flex: 1,
      color: colors.ink,
      fontSize: 22,
      fontWeight: "900",
      lineHeight: 30,
    },
    helperText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    gameTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    changeButton: {
      minHeight: 38,
      justifyContent: "center",
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "#c4d1d9",
      borderRadius: 9,
      backgroundColor: colors.white,
    },
    changeButtonText: {
      color: "#526975",
      fontSize: 12,
      fontWeight: "800",
    },
    turnPanel: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primaryBorder,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    // Player 2's turn is orange so passing the phone is easy to notice.
    turnP2: { backgroundColor: "#fff1e4", borderColor: "#f2c9a0" },
    turnPlayerP2: { color: "#8a3f10" },
    answerActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    primaryButton: { ...buttonStyles.primaryButton, flexGrow: 1 },
    resultPanel: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: "#cfdce4",
      borderRadius: 14,
      padding: 18,
      gap: 10,
    },
    resultAnswer: {
      color: "#596d79",
      fontSize: 16,
      marginBottom: 4,
    },
  }),
};
