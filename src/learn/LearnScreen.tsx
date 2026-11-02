import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { menuStyles } from "../components/menuStyles";
import { PopIn } from "../components/PopIn";
import { SoloBoard } from "../components/SoloBoard";
import { soloResultStyles } from "../components/soloResultStyles";
import { Pressable } from "../components/TapPressable";
import { shuffled } from "../daily/puzzle";
import { startSolo, type SoloPlay } from "../game/solo";
import { colors } from "../theme/colors";
import { cellRomaji, toRomaji } from "./romaji";
import { LEARN_WORDS, learnQuestion, type LearnWord } from "./words";

type Session = {
  order: readonly LearnWord[];
  index: number;
  play: SoloPlay;
  solved: number;
};

function at(order: readonly LearnWord[], index: number) {
  return startSolo(learnQuestion(order[index % order.length]!));
}

// For people learning Japanese (the English app): the word is given in
// English, and they find it in kana on the board, with romaji under
// every cell. Opening cells is the practice.
export function LearnScreen() {
  const [session, setSession] = useState<Session | null>(null);

  function start() {
    const order = shuffled(LEARN_WORDS, Math.random);
    setSession({ order, index: 0, play: at(order, 0), solved: 0 });
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.title}>Learn hiragana</Text>
          <Text style={styles.lead}>
            You get a word in English. Find it in Japanese on the kana board.
          </Text>
          <View style={styles.rules}>
            <Text style={styles.rule}>
              • Tap a cell to open it. A number tells how many letters of the
              answer are around it.
            </Text>
            <Text style={styles.rule}>
              • An orange cell is a letter in the answer.
            </Text>
            <Text style={styles.rule}>
              • Type the answer in kana or romaji (neko, gakkou).
            </Text>
          </View>
          <Pressable style={styles.primary} onPress={start}>
            <Text style={styles.primaryText}>Start</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={styles.back}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { play, order, index } = session;
  const word = order[index % order.length]!;

  function change(next: SoloPlay) {
    setSession(
      (current) =>
        current && {
          ...current,
          play: next,
          solved:
            current.solved +
            (current.play.status === "playing" && next.status === "solved"
              ? 1
              : 0),
        },
    );
  }

  function nextWord() {
    setSession(
      (current) =>
        current && {
          ...current,
          index: current.index + 1,
          play: at(current.order, current.index + 1),
        },
    );
  }

  return (
    <SoloBoard
      key={index}
      play={play}
      onChange={change}
      caption={cellRomaji}
      header={
        <>
          <Text style={styles.ask}>What is “{word.meaning}” in Japanese?</Text>
          <Text style={styles.meta}>
            {play.question.length} kana · {play.moves}{" "}
            {play.moves === 1 ? "move" : "moves"} · solved {session.solved} of{" "}
            {index + (play.status === "playing" ? 0 : 1)}
          </Text>
        </>
      }
      result={
        <PopIn style={styles.result}>
          <Text style={styles.resultTitle}>
            {play.status === "solved" ? "Correct!" : "Here it is"}
          </Text>
          <Text style={styles.word}>
            {word.reading}
            {word.display !== word.reading ? `　${word.display}` : ""}
          </Text>
          <Text style={styles.resultText}>
            {toRomaji(word.reading)} — {word.meaning}
          </Text>
          <View style={styles.actions}>
            <Pressable style={styles.primary} onPress={nextWord}>
              <Text style={styles.primaryText}>Next word</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => router.back()}>
              <Text style={styles.secondaryText}>Home</Text>
            </Pressable>
          </View>
        </PopIn>
      }
    />
  );
}

const styles = {
  ...menuStyles,
  ...soloResultStyles,
  ...StyleSheet.create({
    rules: { gap: 6 },
    rule: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
    ask: { color: colors.ink, fontSize: 21, fontWeight: "900" },
    meta: { color: colors.inkSoft, fontSize: 14, fontWeight: "700" },
    word: { color: colors.ink, fontSize: 28, fontWeight: "900" },
  }),
};
