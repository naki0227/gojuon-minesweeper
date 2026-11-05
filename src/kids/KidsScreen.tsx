import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Confetti } from "../components/Confetti";
import { PopIn } from "../components/PopIn";
import { Pressable } from "../components/TapPressable";
import { shuffled } from "../daily/puzzle";
import { playSound } from "../sound/sounds";
import { colors } from "../theme/colors";
import { KidsBoard } from "./KidsBoard";
import {
  kidsHint,
  kidsSlots,
  openKids,
  startKids,
  type KidsPlay,
} from "./play";
import { KIDS_WORDS, type KidsWord } from "./words";

type Session = { order: readonly KidsWord[]; index: number; play: KidsPlay };

function newSession(): Session {
  const order = shuffled(KIDS_WORDS, Math.random);
  return { order, index: 0, play: startKids(order[0]!) };
}

// こどもモード: a picture, and the child opens its letters on the 五十音
// board. No numbers, no mines, no losing, no ads.
export function KidsScreen() {
  const [session, setSession] = useState(newSession);
  const { play, index } = session;
  const hint = kidsHint(play);

  function open(char: string) {
    const next = openKids(play, char);
    playSound(
      next.cleared ? "correct" : play.needed.includes(char) ? "open" : "tap",
    );
    setSession({ ...session, play: next });
  }

  function nextWord() {
    const nextIndex = index + 1;
    const word = session.order[nextIndex % session.order.length]!;
    setSession({ ...session, index: nextIndex, play: startKids(word) });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>← もどる</Text>
          </Pressable>
          <Text style={styles.stars}>⭐ {index + (play.cleared ? 1 : 0)}</Text>
        </View>
        <Text style={styles.ask}>この え は なあに？</Text>
        <Text style={styles.picture} accessibilityLabel="おだいの え">
          {play.word.emoji}
        </Text>
        <View style={styles.slots}>
          {kidsSlots(play).map((slot, slotIndex) => (
            <View
              key={slotIndex}
              style={[styles.slot, slot.shown && styles.slotShown]}
            >
              <Text style={styles.slotText}>
                {slot.shown ? slot.letter : ""}
              </Text>
            </View>
          ))}
        </View>
        {play.cleared ? (
          <PopIn style={styles.result}>
            <Text style={styles.resultTitle}>せいかい！</Text>
            <Text style={styles.resultWord}>
              {play.word.emoji} {play.word.reading}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={nextWord}
              style={styles.next}
            >
              <Text style={styles.nextText}>つぎの え</Text>
            </Pressable>
          </PopIn>
        ) : (
          <Text style={styles.help}>
            {hint
              ? "ひかっている もじを おしてみよう"
              : "ことばの もじを ひょうから さがして おしてね"}
          </Text>
        )}
        <KidsBoard
          needed={play.needed}
          opened={play.opened}
          hint={hint}
          disabled={play.cleared}
          onOpen={open}
        />
        <Text style={styles.note}>
          「が」は「か」、「ゃ」は「や」のように、てん・まる や ちいさい もじ は
          もとの もじ を おします。
        </Text>
      </ScrollView>
      {play.cleared ? <Confetti key={index} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fffaf0" },
  page: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: 16,
    gap: 12,
    alignItems: "center",
  },
  top: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: { paddingVertical: 8, paddingRight: 12 },
  backText: { color: colors.link, fontSize: 16, fontWeight: "800" },
  stars: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  ask: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  picture: { fontSize: 96, lineHeight: 120 },
  slots: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  slot: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.primaryBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  slotShown: {
    borderStyle: "solid",
    borderColor: colors.accentStrong,
    backgroundColor: "#fff1e2",
  },
  slotText: { color: colors.ink, fontSize: 30, fontWeight: "900" },
  help: { color: colors.inkSoft, fontSize: 16, fontWeight: "700" },
  result: { alignItems: "center", gap: 8 },
  resultTitle: { color: colors.accentStrong, fontSize: 32, fontWeight: "900" },
  resultWord: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  next: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  nextText: { color: colors.white, fontSize: 20, fontWeight: "900" },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
