import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buttonStyles } from "../components/buttonStyles";
import { CharacterBoard } from "../components/CharacterBoard";
import { PopIn } from "../components/PopIn";
import { Pressable } from "../components/TapPressable";
import { questionPrompt } from "../data/questions";
import {
  adjacentMineCount,
  questionMineCharacters,
  questionMineMultiplicity,
} from "../game/engine";
import { colors } from "../theme/colors";
import { fittingWords, puzzleQuestion } from "./pack";
import {
  giveUpPuzzle,
  guessPuzzle,
  openPuzzleCell,
  puzzleStars,
  type PuzzlePlay,
} from "./play";
import { stars } from "./PuzzleList";

// Solving one 詰め五十音 puzzle (Japanese only, like the pack).
export function PuzzleView({
  play,
  index,
  onChange,
  onNext,
  onList,
}: {
  play: PuzzlePlay;
  index: number;
  onChange: (play: PuzzlePlay) => void;
  onNext?: () => void;
  onList: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const { entry } = play;
  const question = puzzleQuestion(entry);
  const mineChars = useMemo(() => questionMineCharacters(question), [question]);
  const left = useMemo(
    () => fittingWords(entry, play.opened).length,
    [entry, play.opened],
  );
  const playing = play.status === "playing";

  function guess() {
    onChange(guessPuzzle(play, answer));
    setAnswer("");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.top}>
          <Text style={styles.number}>第{index + 1}問</Text>
          <Pressable onPress={onList} accessibilityRole="button">
            <Text style={styles.link}>一覧へ</Text>
          </Pressable>
        </View>
        <Text style={styles.prompt}>{questionPrompt(question)}</Text>
        <Text style={styles.goal}>
          目標：{entry.par}手で答えを確定させる（いま{play.moves}手）
        </Text>
        <View style={styles.hint}>
          <Text style={styles.hintText}>この盤面に合う言葉：あと{left}個</Text>
          {play.wrong.length > 0 ? (
            <Text style={styles.wrong}>はずれ：{play.wrong.join("、")}</Text>
          ) : null}
        </View>

        {playing ? (
          <View style={styles.answerRow}>
            <TextInput
              accessibilityLabel="回答"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setAnswer}
              onSubmitEditing={answer.trim() ? guess : undefined}
              placeholder="わかったら答えを入力"
              returnKeyType="done"
              style={styles.input}
              value={answer}
            />
            <Pressable
              disabled={!answer.trim()}
              onPress={guess}
              style={[styles.primary, !answer.trim() && styles.disabled]}
            >
              <Text style={styles.primaryText}>回答</Text>
            </Pressable>
          </View>
        ) : (
          <Result play={play} onNext={onNext} onList={onList} />
        )}

        <CharacterBoard
          language="ja"
          canOpen={playing}
          mineChars={mineChars}
          mineCount={(char) => adjacentMineCount(question, char)}
          mineMultiplicity={(char) => questionMineMultiplicity(question, char)}
          onOpen={(char) => onChange(openPuzzleCell(play, char))}
          openedChars={play.opened}
        />
        {playing ? (
          <Pressable
            onPress={() => onChange(giveUpPuzzle(play))}
            accessibilityRole="button"
            style={styles.giveUp}
          >
            <Text style={styles.link}>あきらめて答えを見る</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Result({
  play,
  onNext,
  onList,
}: {
  play: PuzzlePlay;
  onNext?: () => void;
  onList: () => void;
}) {
  const { entry } = play;
  const got = puzzleStars(play);
  const answer = puzzleQuestion(entry)
    .answers.map((item) => item.display)
    .join(" / ");
  return (
    <PopIn style={styles.result}>
      <Text style={styles.resultTitle}>
        {play.status === "solved"
          ? `正解！ ${play.moves}手 ${stars(got)}`
          : "答えを見ました"}
      </Text>
      <Text style={styles.resultText}>答え：{answer}</Text>
      <Text style={styles.resultText}>
        最初の{entry.words}語から、最短{entry.par}手で確実に1つに絞れます。
        {entry.firstCells.length > 0
          ? `1手目は「${entry.firstCells.slice(0, 4).join("」「")}」${entry.firstCells.length > 4 ? "など" : ""}を開けるのが正解の筋です。`
          : ""}
      </Text>
      <View style={styles.actions}>
        {onNext ? (
          <Pressable style={styles.primary} onPress={onNext}>
            <Text style={styles.primaryText}>次の問題</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.secondary} onPress={onList}>
          <Text style={styles.secondaryText}>一覧へ</Text>
        </Pressable>
      </View>
    </PopIn>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 16,
    gap: 10,
  },
  top: { flexDirection: "row", justifyContent: "space-between" },
  number: { color: colors.muted, fontSize: 14, fontWeight: "800" },
  link: { color: colors.link, fontSize: 14, fontWeight: "700" },
  prompt: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  goal: { color: colors.inkSoft, fontSize: 15, fontWeight: "700" },
  hint: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    padding: 10,
    gap: 4,
  },
  hintText: { color: colors.inkSoft, fontSize: 14, fontWeight: "700" },
  wrong: { color: colors.danger, fontSize: 13 },
  answerRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  primary: buttonStyles.primaryButton,
  primaryText: buttonStyles.primaryButtonText,
  secondary: buttonStyles.secondaryButton,
  secondaryText: buttonStyles.secondaryButtonText,
  disabled: { opacity: 0.45 },
  giveUp: { alignSelf: "center", padding: 10 },
  result: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#cfdce4",
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  resultTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  resultText: { color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
