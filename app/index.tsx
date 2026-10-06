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

import { GojuonBoard } from "../src/components/GojuonBoard";
import {
  QUESTIONS,
  primaryAnswer,
  questionPrompt,
} from "../src/data/questions";
import {
  createInitialState,
  isMineCharacter,
  openCharacter,
  passAnswer,
  questionMineCharacters,
  submitAnswer,
} from "../src/game/engine";
import { trackEvent } from "../src/analytics/events";

export default function HomeScreen() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [game, setGame] = useState(() => createInitialState(QUESTIONS[0]!));
  const [answer, setAnswer] = useState("");

  const mineChars = useMemo(
    () => questionMineCharacters(game.question),
    [game.question],
  );

  const currentPlayerLabel = `Player ${game.currentPlayer + 1}`;
  const canAnswer = game.phase === "answer";
  const canOpen = game.phase === "open";

  function handleSubmitAnswer() {
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

    if (correct) {
      trackEvent("game_finish", {
        question_id: game.question.id,
        winner: game.currentPlayer + 1,
      });
    }

    setGame(next);
    setAnswer("");
  }

  function handlePassAnswer() {
    setGame((current) => passAnswer(current));
    setAnswer("");
  }

  function handleOpen(char: string) {
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

    setGame((current) => openCharacter(current, char));
  }

  function handleNewGame() {
    const nextIndex =
      QUESTIONS.length <= 1
        ? 0
        : (questionIndex +
            1 +
            Math.floor(Math.random() * (QUESTIONS.length - 1))) %
          QUESTIONS.length;

    const nextQuestion = QUESTIONS[nextIndex]!;

    setQuestionIndex(nextIndex);
    setGame(createInitialState(nextQuestion));
    setAnswer("");

    trackEvent(game.winner === null ? "game_start" : "rematch", {
      question_id: nextQuestion.id,
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>五十音マインスイーパー</Text>
          <Text style={styles.prompt}>{questionPrompt(game.question)}</Text>
          <Text style={styles.rule}>
            回答してから1文字開く。セーフなら周囲8マスの地雷数が出て、0なら周辺も自動で開きます。地雷を開いたら次の自分のターンは回答できません。
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

        {game.phase === "finished" ? (
          <View style={styles.resultPanel}>
            <Text style={styles.resultTitle}>
              Player {game.winner! + 1} の勝ち！
            </Text>
            <Text style={styles.resultAnswer}>
              答え：{game.question.answers.join(" / ")}
            </Text>
            <Pressable style={styles.primaryButton} onPress={handleNewGame}>
              <Text style={styles.primaryButtonText}>もう一戦</Text>
            </Pressable>
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
                onSubmitEditing={canAnswer && answer.trim() ? handleSubmitAnswer : undefined}
                placeholder={canAnswer ? "ひらがな・カタカナで回答" : "このターンは回答できません"}
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
                    (!canAnswer || !answer.trim()) ? styles.disabledButton : null,
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

            <GojuonBoard
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
            <Text style={styles.legendText}>セーフ</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.mineSwatch]} />
            <Text style={styles.legendText}>地雷</Text>
          </View>
          <Text style={styles.legendNote}>「ー」は「ん」の下</Text>
        </View>

        {Platform.OS === "web" ? (
          <Text style={styles.webNote}>
            Web版も同じコードで動作します。オンライン対戦では答えをクライアントに配らない構成へ変更予定です。
          </Text>
        ) : null}
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
