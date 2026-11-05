import { useMemo, useState, type ReactNode } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinnedBannerScreen } from "../ads/PinnedBannerScreen";
import { matchBanner } from "../ads/types";
import {
  adjacentMineCount,
  questionMineCharacters,
  questionMineMultiplicity,
} from "../game/engine";
import {
  giveUpSolo,
  guessSolo,
  hintSolo,
  openSoloCell,
  type SoloPlay,
} from "../game/solo";
import { HintButtons } from "../hint/HintButtons";
import { tr } from "../i18n";
import { colors } from "../theme/colors";
import { buttonStyles } from "./buttonStyles";
import { CharacterBoard } from "./CharacterBoard";
import { Pressable } from "./TapPressable";

const S = tr({
  ja: {
    placeholder: "わかったら答えを入力",
    answer: "回答",
    wrong: (words: string) => `はずれ：${words}`,
    giveUp: "あきらめて答えを見る",
  },
  en: {
    placeholder: "Type the word when you know it",
    answer: "Answer",
    wrong: (words: string) => `Not it: ${words}`,
    giveUp: "Give up and see the answer",
  },
});

// One player opening cells and guessing one word: 詰め五十音 and the
// custom question. The caller puts its own heading and notes above the
// board, and its result in place of the answer box once it is over.
export function SoloBoard({
  play,
  header,
  notes,
  result,
  caption,
  hintNote,
  onChange,
}: {
  play: SoloPlay;
  header: ReactNode;
  notes?: ReactNode;
  result: ReactNode;
  caption?: (char: string) => string;
  // Shown under the hint button, such as what a hint costs.
  hintNote?: string;
  onChange: (play: SoloPlay) => void;
}) {
  const [answer, setAnswer] = useState("");
  const { question } = play;
  const mineChars = useMemo(() => questionMineCharacters(question), [question]);
  const playing = play.status === "playing";
  const hinted = useMemo(() => new Set(play.hints ?? []), [play.hints]);
  const canHint = playing && hintSolo(play) !== play;

  function guess() {
    onChange(guessSolo(play, answer));
    setAnswer("");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <PinnedBannerScreen
        banner={matchBanner(playing ? "playing" : "finished")}
        layoutKey={question.id}
        contentStyle={styles.page}
      >
        {header}
        {notes || play.wrong.length > 0 ? (
          <View style={styles.notes}>
            {notes}
            {play.wrong.length > 0 ? (
              <Text style={styles.wrong}>
                {S.wrong(play.wrong.join(" / "))}
              </Text>
            ) : null}
          </View>
        ) : null}
        {playing ? (
          <View style={styles.answerRow}>
            <TextInput
              accessibilityLabel={S.answer}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setAnswer}
              onSubmitEditing={answer.trim() ? guess : undefined}
              placeholder={S.placeholder}
              returnKeyType="done"
              style={styles.input}
              value={answer}
            />
            <Pressable
              disabled={!answer.trim()}
              onPress={guess}
              style={[styles.primary, !answer.trim() && styles.disabled]}
            >
              <Text style={styles.primaryText}>{S.answer}</Text>
            </Pressable>
          </View>
        ) : (
          result
        )}
        <CharacterBoard
          language={question.language}
          canOpen={playing}
          mineChars={mineChars}
          mineCount={(char) => adjacentMineCount(question, char)}
          mineMultiplicity={(char) => questionMineMultiplicity(question, char)}
          onOpen={(char) => onChange(openSoloCell(play, char))}
          openedChars={play.opened}
          hintedChars={hinted}
          caption={caption}
        />
        {canHint ? (
          <HintButtons
            used={play.hints?.length ?? 0}
            actionKey={`solo:${question.id}:${play.hints?.length ?? 0}`}
            note={hintNote}
            onHint={() => onChange(hintSolo(play))}
          />
        ) : null}
        {playing ? (
          <Pressable
            onPress={() => onChange(giveUpSolo(play))}
            accessibilityRole="button"
            style={styles.giveUp}
          >
            <Text style={styles.giveUpText}>{S.giveUp}</Text>
          </Pressable>
        ) : null}
      </PinnedBannerScreen>
    </SafeAreaView>
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
  notes: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    padding: 10,
    gap: 4,
  },
  wrong: { color: colors.danger, fontSize: 13 },
  answerRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    // Without it, the web lets a long placeholder push the button off screen.
    minWidth: 0,
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
  disabled: { opacity: 0.45 },
  giveUp: { alignSelf: "center", padding: 10 },
  giveUpText: { color: colors.link, fontSize: 14, fontWeight: "700" },
});
