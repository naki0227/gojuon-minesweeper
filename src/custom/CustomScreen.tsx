import { useState } from "react";
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { buttonStyles } from "../components/buttonStyles";
import { menuStyles } from "../components/menuStyles";
import { PopIn } from "../components/PopIn";
import { SoloBoard } from "../components/SoloBoard";
import { soloResultStyles } from "../components/soloResultStyles";
import { Pressable } from "../components/TapPressable";
import type { QuestionLanguage } from "../data/types";
import { startSolo, type SoloPlay } from "../game/solo";
import { LOCALE } from "../i18n";
import { colors } from "../theme/colors";
import { CUSTOM_TEXT as S } from "./custom.strings";
import { buildCustomQuestion, checkCustom, type CustomInput } from "./question";

type Step =
  | { kind: "setup" }
  | { kind: "handoff"; play: SoloPlay }
  | { kind: "play"; play: SoloPlay };

// One person types a word, hands the phone over, and the other works it
// out from the board. Everything stays on this device.
export function CustomScreen() {
  const [input, setInput] = useState<CustomInput>({
    language: LOCALE === "en" ? "en" : "ja",
    reading: "",
    display: "",
    hint: "",
  });
  const [tried, setTried] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "setup" });
  const problem = checkCustom(input);

  function ready() {
    setTried(true);
    const question = buildCustomQuestion(input);
    if (question) setStep({ kind: "handoff", play: startSolo(question) });
  }

  function again() {
    setInput((current) => ({ ...current, reading: "", display: "", hint: "" }));
    setTried(false);
    setStep({ kind: "setup" });
  }

  if (step.kind === "play") {
    const { play } = step;
    const prompt = S.prompt(play.question.length, play.question.category);
    const word = play.question.answers[0]!.display;
    return (
      <SoloBoard
        play={play}
        onChange={(next) => setStep({ kind: "play", play: next })}
        header={
          <>
            <Text style={styles.prompt}>{prompt}</Text>
            <Text style={styles.moves}>{S.moves(play.moves)}</Text>
          </>
        }
        result={
          <PopIn style={styles.result}>
            <Text style={styles.resultTitle}>
              {play.status === "solved" ? S.solved(play.moves) : S.gaveUp}
            </Text>
            <Text style={styles.resultText}>{S.answer(word)}</Text>
            <View style={styles.actions}>
              {play.status === "solved" ? (
                <Pressable
                  style={styles.primary}
                  onPress={() =>
                    void Share.share({
                      message: S.shareText(prompt, word, play.moves),
                    }).catch(() => {})
                  }
                >
                  <Text style={styles.primaryText}>{S.share}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.secondary} onPress={again}>
                <Text style={styles.secondaryText}>{S.again}</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => router.back()}>
                <Text style={styles.secondaryText}>{S.home}</Text>
              </Pressable>
            </View>
          </PopIn>
        }
      />
    );
  }

  if (step.kind === "handoff") {
    const { question } = step.play;
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.page, styles.handoff]}>
          <Text style={styles.title}>{S.handoffTitle}</Text>
          <Text style={styles.lead}>
            {S.handoffLead(S.prompt(question.length, question.category))}
          </Text>
          <Pressable
            style={styles.primary}
            onPress={() => setStep({ kind: "play", play: step.play })}
          >
            <Text style={styles.primaryText}>{S.start}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const field = (
    key: "reading" | "display" | "hint",
    label: string,
    secret = false,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secret}
        onChangeText={(text) =>
          setInput((current) => ({ ...current, [key]: text }))
        }
        style={styles.input}
        value={input[key]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{S.title}</Text>
        <Text style={styles.lead}>{S.lead}</Text>
        <View style={styles.tabs}>
          {(["ja", "en"] as QuestionLanguage[]).map((language) => (
            <Pressable
              key={language}
              accessibilityRole="tab"
              accessibilityState={{ selected: input.language === language }}
              onPress={() => setInput((current) => ({ ...current, language }))}
              style={[styles.tab, input.language === language && styles.tabOn]}
            >
              <Text style={styles.tabText}>{S.language[language]}</Text>
            </Pressable>
          ))}
        </View>
        {/* The reading is hidden so a friend looking on can't read it. */}
        {field("reading", S.reading(input.language), true)}
        {input.language === "ja" ? field("display", S.display) : null}
        {field("hint", S.hint)}
        {tried && problem ? (
          <Text style={styles.problem}>{S.problem[problem]}</Text>
        ) : null}
        <Pressable style={styles.primary} onPress={ready}>
          <Text style={styles.primaryText}>{S.ready}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.back}
        >
          <Text style={styles.backText}>{S.back}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  ...menuStyles,
  ...soloResultStyles,
  ...StyleSheet.create({
    handoff: { flex: 1, justifyContent: "center" },
    tabs: { flexDirection: "row", gap: 8 },
    tab: { ...buttonStyles.secondaryButton, flexGrow: 1 },
    tabOn: { borderColor: colors.ink, borderWidth: 2 },
    tabText: { color: colors.ink, fontSize: 15, fontWeight: "800" },
    field: { gap: 4 },
    label: { color: colors.inkSoft, fontSize: 13, fontWeight: "700" },
    input: {
      minHeight: 44,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 10,
      backgroundColor: colors.white,
      paddingHorizontal: 12,
      fontSize: 16,
    },
    problem: { color: colors.danger, fontSize: 13 },
    prompt: { color: colors.ink, fontSize: 22, fontWeight: "900" },
    moves: { color: colors.inkSoft, fontSize: 15, fontWeight: "700" },
  }),
};
