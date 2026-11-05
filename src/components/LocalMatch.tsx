import { useMemo, useState, type ReactNode } from "react";
import { Animated, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinnedBannerScreen } from "../ads/PinnedBannerScreen";
import { matchBanner } from "../ads/types";
import { gameMessage, promptText } from "../i18n/text";
import {
  adjacentMineCount,
  answerHint,
  questionMineCharacters,
  questionMineMultiplicity,
  type GameState,
  type PlayerIndex,
} from "../game/engine";
import { CharacterBoard } from "./CharacterBoard";
import { Confetti } from "./Confetti";
import { LOCAL_MATCH_TEXT as S } from "./LocalMatch.strings";
import { localMatchStyles as styles } from "./LocalMatch.styles";
import { USE_NATIVE_DRIVER, useReducedMotion } from "./motion";
import { PopIn } from "./PopIn";
import { RuleHelp } from "./RuleHelp";
import { Pressable } from "./TapPressable";

// One game on one device: the two-player match (app/index.tsx) and the
// match against the bot (app/bot.tsx).
export function LocalMatch({
  game,
  playerLabel = (player) => `Player ${player + 1}`,
  locked = false,
  aside,
  hintedChars,
  resultTitle,
  celebrate,
  onSubmit,
  onPass,
  onOpen,
  onRematch,
  onChangeSettings,
}: {
  game: GameState;
  playerLabel?: (player: PlayerIndex) => string;
  // The other side (the bot) is playing: the person can't act.
  locked?: boolean;
  aside?: ReactNode;
  // Safe cells lit up by hints (the match against the bot).
  hintedChars?: ReadonlySet<string>;
  resultTitle: string;
  celebrate: boolean;
  // Returns whether the answer was right.
  onSubmit: (answer: string) => boolean;
  onPass: () => void;
  onOpen: (char: string) => void;
  onRematch: () => void;
  onChangeSettings: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const reducedMotion = useReducedMotion();
  const wrongShake = useState(() => new Animated.Value(0))[0];
  const mineChars = useMemo(
    () => questionMineCharacters(game.question),
    [game.question],
  );

  const canAnswer = game.phase === "answer" && !locked;
  const canOpen = game.phase === "open" && !locked;
  // Messages name "Player 1/2"; a match against the bot names the sides.
  const message = gameMessage(game)
    .replaceAll("Player 1", playerLabel(0))
    .replaceAll("Player 2", playerLabel(1));

  function submit() {
    const correct = onSubmit(answer);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <PinnedBannerScreen
        banner={matchBanner(game.phase)}
        layoutKey={game.question.id}
        contentStyle={styles.page}
      >
        <View style={styles.gameTopBar}>
          <Text style={styles.prompt}>{promptText(game.question)}</Text>
          <Pressable onPress={onChangeSettings} style={styles.changeButton}>
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
              {playerLabel(game.currentPlayer)}
            </Text>
          </View>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>
              {game.phase === "finished"
                ? S.phaseFinished
                : game.phase === "answer"
                  ? S.phaseAnswer
                  : S.phaseOpen}
            </Text>
          </View>
        </View>

        <View style={styles.messagePanel}>
          <Text style={styles.message}>{message}</Text>
        </View>

        {game.revealedAnswerChars > 0 && game.phase !== "finished" ? (
          <View style={styles.messagePanel}>
            <Text style={styles.message}>{S.answerHint(answerHint(game))}</Text>
          </View>
        ) : null}

        {aside}

        {game.phase === "finished" ? (
          <PopIn style={styles.resultPanel}>
            <Text style={styles.resultTitle}>{resultTitle}</Text>
            <Text style={styles.resultAnswer}>
              {S.answer(
                game.question.answers.map((item) => item.display).join(" / "),
              )}
            </Text>
            {game.question.answers.length > 1 ? (
              <Text style={styles.helperText}>{S.sameLetters}</Text>
            ) : null}
            <View style={styles.answerActions}>
              <Pressable style={styles.primaryButton} onPress={onRematch}>
                <Text style={styles.primaryButtonText}>{S.rematch}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={onChangeSettings}
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
                  canAnswer && answer.trim() ? submit : undefined
                }
                placeholder={
                  canAnswer
                    ? S.placeholder(game.question.language)
                    : S.cannotAnswer
                }
                returnKeyType="done"
                style={[styles.input, !canAnswer ? styles.inputDisabled : null]}
                value={answer}
              />
              <View style={styles.answerActions}>
                <Pressable
                  silent
                  disabled={!canAnswer || !answer.trim()}
                  onPress={submit}
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
                  onPress={() => {
                    onPass();
                    setAnswer("");
                  }}
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
              onOpen={onOpen}
              openedChars={game.openedChars}
              hintedChars={hintedChars}
            />
          </>
        )}
      </PinnedBannerScreen>
      {celebrate && !reducedMotion ? <Confetti key={game.question.id} /> : null}
    </SafeAreaView>
  );
}
