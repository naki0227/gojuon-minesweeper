import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { trackEvent } from "../analytics/events";
import { RewardHintButton } from "../ads/RewardHintButton";
import { buttonStyles } from "../components/buttonStyles";
import { LocalMatch } from "../components/LocalMatch";
import { menuStyles } from "../components/menuStyles";
import { Pressable } from "../components/TapPressable";
import { parseFilters } from "../data/filters";
import { pickRandomQuestion } from "../data/questions";
import {
  createInitialState,
  openCharacter,
  passAnswer,
  submitAnswer,
  type GameState,
} from "../game/engine";
import { safeHint } from "../game/hint";
import { noteWinForReview } from "../review/askForReview";
import { localSnapshot } from "../sound/snapshots";
import { playSound } from "../sound/sounds";
import { transitionSound } from "../sound/transitions";
import { colors } from "../theme/colors";
import { BOT_TEXT as S } from "./bot.strings";
import { botMove, createBot, type Bot, type BotLevel } from "./brain";

const LEVELS: readonly BotLevel[] = ["easy", "normal", "hard"];
// The person is Player 1 and goes first; the bot is Player 2.
const BOT_PLAYER = 1;
// Long enough to follow what the bot did, short enough not to drag.
const BOT_DELAY_MS = 1100;

type Match = {
  game: GameState;
  bot: Bot;
  thought: number | null;
  // Safe cells the person lit up with a hint (rewarded ad).
  hints: readonly string[];
};

export function BotScreen() {
  const params = useLocalSearchParams<{ filters?: string }>();
  const filters = useMemo(() => parseFilters(params.filters), [params.filters]);
  const [level, setLevel] = useState<BotLevel | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [empty, setEmpty] = useState(false);

  function start(nextLevel: BotLevel, excludeId?: string) {
    const question = pickRandomQuestion(filters, excludeId);
    if (!question) {
      setEmpty(true);
      return;
    }
    setLevel(nextLevel);
    setMatch({
      game: createInitialState(question),
      bot: createBot(nextLevel, question, question.id),
      thought: null,
      hints: [],
    });
    trackEvent("game_start", {
      question_id: question.id,
      language: question.language,
      category: question.category,
      answer_length: question.length,
      opponent: `bot_${nextLevel}`,
    });
  }

  function apply(previous: Match, next: GameState, thought = previous.thought) {
    const { game } = previous;
    if (game.phase !== "finished" && next.phase === "finished") {
      trackEvent("game_finish", {
        question_id: game.question.id,
        winner: next.winner === null ? "draw" : next.winner + 1,
        opponent: `bot_${previous.bot.level}`,
      });
      if (next.winner === 0) void noteWinForReview();
    }
    playSound(transitionSound(localSnapshot(game), localSnapshot(next)));
    setMatch({ ...previous, game: next, thought });
  }

  const botTurn =
    match !== null &&
    match.game.phase !== "finished" &&
    match.game.currentPlayer === BOT_PLAYER;

  useEffect(() => {
    if (!botTurn || !match) return;
    const timer = setTimeout(() => {
      const move = botMove(match.bot, match.game);
      if (!move) return;
      const next =
        move.kind === "answer"
          ? submitAnswer(match.game, move.text)
          : move.kind === "pass"
            ? passAnswer(match.game)
            : openCharacter(match.game, move.char);
      apply(match, next, move.candidates);
    }, BOT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [botTurn, match]);

  if (!match || !level) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.title}>{S.title}</Text>
          <Text style={styles.lead}>{empty ? S.noQuestion : S.lead}</Text>
          {LEVELS.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => start(item)}
              style={({ pressed }) => [
                styles.levelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.levelName}>{S.level[item]}</Text>
              <Text style={styles.levelNote}>{S.levelNote[item]}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>{S.back}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { game } = match;
  const labels = [S.you, S.bot(level)] as const;
  const nextHint =
    game.phase === "open" && !botTurn
      ? safeHint(game.question, game.openedChars, match.hints)
      : null;

  return (
    <LocalMatch
      game={game}
      playerLabel={(player) => labels[player]}
      locked={botTurn}
      hintedChars={new Set(match.hints)}
      aside={
        game.phase === "finished" ? null : (
          <>
            <View style={styles.thought}>
              <Text style={styles.thoughtText}>
                {botTurn
                  ? S.thinking
                  : match.thought === null
                    ? S.lead
                    : S.thought(match.thought)}
              </Text>
            </View>
            {nextHint ? (
              <RewardHintButton
                onReward={() =>
                  setMatch((current) =>
                    current && current.game === game
                      ? { ...current, hints: [...current.hints, nextHint] }
                      : current,
                  )
                }
              />
            ) : null}
          </>
        )
      }
      resultTitle={
        game.winner === null
          ? S.draw
          : game.winner === BOT_PLAYER
            ? S.botWins
            : S.youWin
      }
      celebrate={game.winner === 0}
      onSubmit={(answer) => {
        const next = submitAnswer(game, answer);
        apply(match, next);
        return next.winner !== null;
      }}
      onPass={() => apply(match, passAnswer(game))}
      onOpen={(char) => apply(match, openCharacter(game, char))}
      onRematch={() => start(level, game.question.id)}
      onChangeSettings={() => router.back()}
    />
  );
}

const styles = {
  ...menuStyles,
  ...StyleSheet.create({
    levelButton: {
      ...buttonStyles.secondaryButton,
      alignItems: "flex-start",
      paddingVertical: 12,
      gap: 2,
    },
    levelName: { color: colors.ink, fontSize: 17, fontWeight: "900" },
    levelNote: { color: colors.muted, fontSize: 13 },
    pressed: { opacity: 0.7 },
    thought: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#f2c9a0",
      backgroundColor: "#fff8f1",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    thoughtText: { color: "#8a3f10", fontSize: 14, fontWeight: "700" },
  }),
};
