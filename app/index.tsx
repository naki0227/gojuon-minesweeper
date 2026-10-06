import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Head from "expo-router/head";

import { BannerAd } from "../src/ads/BannerAd";
import { trackEvent } from "../src/analytics/events";
import { CharacterBoard } from "../src/components/CharacterBoard";
import { HomeSetup } from "../src/components/HomeSetup";
import { pickRandomQuestion, questionPrompt } from "../src/data/questions";
import type { QuestionFilters } from "../src/data/types";
import {
  answerHint,
  createInitialState,
  isMineCharacter,
  openCharacter,
  passAnswer,
  questionMineCharacters,
  submitAnswer,
  type GameState,
} from "../src/game/engine";

const INITIAL_FILTERS: QuestionFilters = {
  language: "ja",
  categories: [],
  length: "any",
};

export default function HomeScreen() {
  const [filters, setFilters] = useState<QuestionFilters>(INITIAL_FILTERS);
  const [game, setGame] = useState<GameState | null>(null);
  const [answer, setAnswer] = useState("");

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
        <Head>
          <title>五十音マインスイーパー | ことば当てゲーム</title>
          <meta
            name="description"
            content="ことばを予想して文字を開く、2人で遊べるマインスイーパー。日本語と英語のカテゴリを選んで対戦できます。"
          />
        </Head>
        <HomeSetup
          filters={filters}
          onChangeFilters={setFilters}
          onStart={(nextFilters) => startGame(nextFilters)}
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
    }
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

  const answerPlaceholder =
    game.question.language === "ja"
      ? "漢字・ひらがな・カタカナで回答"
      : "英単語を入力";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <View style={styles.gameTopBar}>
          <Text style={styles.eyebrow}>
            {game.question.language === "ja"
              ? "五十音マインスイーパー"
              : "ALPHABET MINESWEEPER"}
          </Text>
          <Pressable onPress={() => setGame(null)} style={styles.changeButton}>
            <Text style={styles.changeButtonText}>条件を変える</Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.prompt}>{questionPrompt(game.question)}</Text>
          <Text style={styles.rule}>
            回答してから1文字開く。セーフなら周囲8マスの地雷数を表示。0なら安全地帯が連鎖して開きます。地雷なら次の自分のターンは回答権なし。
          </Text>
        </View>

        <View style={styles.turnPanel}>
          <View>
            <Text style={styles.turnCaption}>現在の手番</Text>
            <Text style={styles.turnPlayer}>{currentPlayerLabel}</Text>
          </View>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>
              {game.phase === "finished"
                ? "決着"
                : canAnswer
                  ? "回答"
                  : "1文字開く"}
            </Text>
          </View>
        </View>

        <View style={styles.messagePanel}>
          <Text style={styles.message}>{game.lastMessage}</Text>
        </View>

        {game.revealedAnswerChars > 0 && game.phase !== "finished" ? (
          <View style={styles.messagePanel}>
            <Text style={styles.message}>答えの文字：{answerHint(game)}</Text>
          </View>
        ) : null}

        {game.phase === "finished" ? (
          <View style={styles.resultPanel}>
            <Text style={styles.resultTitle}>
              {game.winner === null
                ? "引き分け！"
                : `Player ${game.winner + 1} の勝ち！`}
            </Text>
            <Text style={styles.resultAnswer}>
              答え：
              {game.question.answers.map((item) => item.display).join(" / ")}
            </Text>
            {game.question.answers.length > 1 ? (
              <Text style={styles.helperText}>
                同じ文字構成のため、どれも正解として扱います。
              </Text>
            ) : null}
            <View style={styles.answerActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => startGame(filters, game.question.id)}
              >
                <Text style={styles.primaryButtonText}>同じ条件でもう一戦</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setGame(null)}
              >
                <Text style={styles.secondaryButtonText}>条件を変える</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.answerArea}>
              <TextInput
                accessibilityLabel="回答"
                autoCapitalize="none"
                autoCorrect={false}
                editable={canAnswer}
                enterKeyHint="done"
                onChangeText={setAnswer}
                onSubmitEditing={
                  canAnswer && answer.trim() ? handleSubmitAnswer : undefined
                }
                placeholder={
                  canAnswer ? answerPlaceholder : "このターンは回答できません"
                }
                returnKeyType="done"
                style={[styles.input, !canAnswer ? styles.inputDisabled : null]}
                value={answer}
              />
              <View style={styles.answerActions}>
                <Pressable
                  disabled={!canAnswer || !answer.trim()}
                  onPress={handleSubmitAnswer}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    !canAnswer || !answer.trim() ? styles.disabledButton : null,
                    pressed ? styles.pressedButton : null,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>回答する</Text>
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
                  <Text style={styles.secondaryButtonText}>回答しない</Text>
                </Pressable>
              </View>
            </View>

            <CharacterBoard
              question={game.question}
              canOpen={canOpen}
              mineChars={mineChars}
              onOpen={handleOpen}
              openedChars={game.openedChars}
            />
          </>
        )}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.safeSwatch]} />
            <Text style={styles.legendText}>セーフ + 周囲の地雷数</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.mineSwatch]} />
            <Text style={styles.legendText}>地雷</Text>
          </View>
          {game.question.language === "ja" ? (
            <Text style={styles.legendNote}>「ー」は「ん」の下</Text>
          ) : null}
        </View>

        {Platform.OS === "web" ? (
          <Text style={styles.webNote}>
            Web版も同じコードで動作します。オンライン対戦では正解をクライアントへ配らない構成に変更予定です。
          </Text>
        ) : null}

        {/* Ads only once the game is decided; never during play. */}
        {game.phase === "finished" ? <BannerAd placement="result" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7fafc",
  },
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    color: "#4285a8",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  prompt: {
    color: "#102433",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 38,
  },
  rule: {
    color: "#627481",
    fontSize: 14,
    lineHeight: 21,
  },
  helperText: {
    color: "#7b8992",
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
    backgroundColor: "#ffffff",
  },
  changeButtonText: {
    color: "#526975",
    fontSize: 12,
    fontWeight: "800",
  },
  turnPanel: {
    backgroundColor: "#eaf6fb",
    borderColor: "#bcddea",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  turnCaption: {
    color: "#637b89",
    fontSize: 12,
    fontWeight: "700",
  },
  turnPlayer: {
    color: "#173f55",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  phaseBadge: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  phaseText: {
    color: "#28566e",
    fontSize: 13,
    fontWeight: "800",
  },
  messagePanel: {
    minHeight: 46,
    justifyContent: "center",
    borderLeftColor: "#e98a2f",
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  message: {
    color: "#3e4c56",
    fontSize: 14,
    lineHeight: 21,
  },
  answerArea: {
    gap: 10,
  },
  input: {
    minHeight: 48,
    backgroundColor: "#ffffff",
    borderColor: "#bdcbd5",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: "#142733",
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: "#eef2f5",
    color: "#84919a",
  },
  answerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryButton: {
    minHeight: 46,
    backgroundColor: "#3388b0",
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 46,
    borderColor: "#b9c9d3",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#405967",
    fontWeight: "800",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.4,
  },
  pressedButton: {
    opacity: 0.72,
  },
  resultPanel: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cfdce4",
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  resultTitle: {
    color: "#173f55",
    fontSize: 24,
    fontWeight: "900",
  },
  resultAnswer: {
    color: "#596d79",
    fontSize: 16,
    marginBottom: 4,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  safeSwatch: {
    backgroundColor: "#eef2f5",
    borderColor: "#d8e0e6",
  },
  mineSwatch: {
    backgroundColor: "#fff0df",
    borderColor: "#e98a2f",
  },
  legendText: {
    color: "#677985",
    fontSize: 12,
  },
  legendNote: {
    color: "#677985",
    fontSize: 12,
  },
  webNote: {
    color: "#88959d",
    fontSize: 11,
    lineHeight: 17,
  },
});
