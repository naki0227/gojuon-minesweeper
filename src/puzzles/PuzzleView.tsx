import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PopIn } from "../components/PopIn";
import { SoloBoard } from "../components/SoloBoard";
import { soloResultStyles } from "../components/soloResultStyles";
import { Pressable } from "../components/TapPressable";
import { questionPrompt } from "../data/questions";
import type { SoloPlay } from "../game/solo";
import { colors } from "../theme/colors";
import { fittingWords, type PuzzleEntry } from "./pack";
import { puzzleStars } from "./play";
import { stars } from "./PuzzleList";

// Solving one 詰め五十音 puzzle (Japanese only, like the pack).
export function PuzzleView({
  entry,
  play,
  index,
  onChange,
  onNext,
  onList,
}: {
  entry: PuzzleEntry;
  play: SoloPlay;
  index: number;
  onChange: (play: SoloPlay) => void;
  onNext?: () => void;
  onList: () => void;
}) {
  const left = useMemo(
    () => fittingWords(entry, play.opened).length,
    [entry, play.opened],
  );
  return (
    <SoloBoard
      play={play}
      onChange={onChange}
      hintNote="使うと★は1つまで"
      header={
        <>
          <View style={styles.top}>
            <Text style={styles.number}>第{index + 1}問</Text>
            <Pressable onPress={onList} accessibilityRole="button">
              <Text style={styles.link}>一覧へ</Text>
            </Pressable>
          </View>
          <Text style={styles.prompt}>{questionPrompt(play.question)}</Text>
          <Text style={styles.goal}>
            目標：{entry.par}手で答えを確定させる（いま{play.moves}手）
          </Text>
        </>
      }
      notes={<Text style={styles.left}>この盤面に合う言葉：あと{left}個</Text>}
      result={
        <Result entry={entry} play={play} onNext={onNext} onList={onList} />
      }
    />
  );
}

function Result({
  entry,
  play,
  onNext,
  onList,
}: {
  entry: PuzzleEntry;
  play: SoloPlay;
  onNext?: () => void;
  onList: () => void;
}) {
  const answer = play.question.answers.map((item) => item.display).join(" / ");
  const first = entry.firstCells.slice(0, 4).join("」「");
  return (
    <PopIn style={styles.result}>
      <Text style={styles.resultTitle}>
        {play.status === "solved"
          ? `正解！ ${play.moves}手 ${stars(puzzleStars(play, entry.par))}`
          : "答えを見ました"}
      </Text>
      <Text style={styles.resultText}>答え：{answer}</Text>
      <Text style={styles.resultText}>
        最初の{entry.words}語から、最短{entry.par}手で確実に1つに絞れます。
        {first
          ? `1手目は「${first}」${entry.firstCells.length > 4 ? "など" : ""}を開けるのが正解の筋です。`
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

const styles = {
  ...soloResultStyles,
  ...StyleSheet.create({
    top: { flexDirection: "row", justifyContent: "space-between" },
    number: { color: colors.muted, fontSize: 14, fontWeight: "800" },
    link: { color: colors.link, fontSize: 14, fontWeight: "700" },
    prompt: { color: colors.ink, fontSize: 22, fontWeight: "900" },
    goal: { color: colors.inkSoft, fontSize: 15, fontWeight: "700" },
    left: { color: colors.inkSoft, fontSize: 14, fontWeight: "700" },
  }),
};
