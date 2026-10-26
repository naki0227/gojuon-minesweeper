// 今日の一問 in the app (Japanese only, like the puzzle itself). The board
// starts as in the day's image; open cells or guess until it's solved.
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { CharacterBoard } from "../components/CharacterBoard";
import { Pressable } from "../components/TapPressable";
import { questionPrompt } from "../data/questions";
import {
  adjacentMineCount,
  questionMineCharacters,
  questionMineMultiplicity,
} from "../game/engine";
import { trackEvent } from "../analytics/events";
import { playSound } from "../sound/sounds";
import { styles } from "../endless/styles";
import { DailyDone } from "./DailyDone";
import {
  giveUpDaily,
  guessDaily,
  openDaily,
  startDaily,
  type DailyPlay,
} from "./play";
import { loadDaily, type DailyLoad } from "./remote";
import { shortDate } from "./dates";
import { readDailyMemory, writeDailyMemory, type DailyMemory } from "./storage";
import { recordSolve } from "./streak";

export function DailyScreen() {
  const [load, setLoad] = useState<DailyLoad | null>(null);
  const [memory, setMemory] = useState<DailyMemory | null>(null);
  const [play, setPlay] = useState<DailyPlay | null>(null);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    void Promise.all([loadDaily(), readDailyMemory()]).then(
      ([loaded, saved]) => {
        setLoad(loaded);
        setMemory(saved);
        if (loaded.status === "ok") {
          const { date, question, opened } = loaded.daily;
          setPlay(startDaily(date, question, opened, saved.play));
        }
      },
    );
  }, []);

  const mineChars = useMemo(
    () => (play ? questionMineCharacters(play.question) : new Set<string>()),
    [play],
  );

  function update(next: DailyPlay) {
    if (!play || !memory || next === play) return;
    const last = next.moves.at(-1);
    playSound(last === "safe" ? "open" : (last ?? null));
    const solvedNow = play.phase === "playing" && next.phase === "solved";
    const nextMemory: DailyMemory = {
      ...memory,
      play: {
        date: next.date,
        opened: next.opened,
        moves: next.moves,
        phase: next.phase,
      },
      streak: solvedNow ? recordSolve(memory.streak, next.date) : memory.streak,
    };
    if (next.phase !== "playing" && play.phase === "playing") {
      trackEvent("daily_finish", {
        date: next.date,
        solved: next.phase === "solved",
        moves: next.moves.length,
      });
    }
    setPlay(next);
    setMemory(nextMemory);
    void writeDailyMemory(nextMemory);
  }

  function submit() {
    if (!play || !answer.trim()) return;
    const next = guessDaily(play, answer);
    setWrong(next.phase === "playing");
    setAnswer("");
    update(next);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.page}
        >
          <View style={styles.top}>
            <Link href="/" style={styles.exitText}>
              ‹ ホーム
            </Link>
            <Text style={styles.eyebrow}>
              今日の一問{play ? ` ${shortDate(play.date)}` : ""}
            </Text>
          </View>

          {!load ? (
            <Text style={styles.micro}>読み込み中…</Text>
          ) : load.status !== "ok" || !play || !memory ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>
                {load.status === "offline"
                  ? "通信できませんでした"
                  : "今日の問題を準備中です"}
              </Text>
              <Text style={styles.panelText}>
                {load.status === "offline"
                  ? "電波のよいところで開き直してね。"
                  : "毎朝7時すぎに新しい問題が出ます。出ない場合はアプリを最新版にしてください。"}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.prompt}>{questionPrompt(play.question)}</Text>
              {!load.daily.isToday ? (
                <Text style={styles.micro}>
                  今日の問題はまだ準備中なので、昨日の問題を表示しています。
                </Text>
              ) : null}
              <View style={styles.message}>
                <Text style={styles.messageText}>
                  {play.phase !== "playing"
                    ? "おつかれさま！"
                    : wrong
                      ? "ちがうみたい…マスを開いてヒントを探そう。"
                      : "数字は周りにある答えの文字の数。オレンジは答えの文字。マスを開くか、答えを入力しよう。"}
                </Text>
              </View>
              <CharacterBoard
                language={play.question.language}
                openedChars={play.opened}
                mineChars={mineChars}
                mineCount={(char) => adjacentMineCount(play.question, char)}
                mineMultiplicity={(char) =>
                  questionMineMultiplicity(play.question, char)
                }
                canOpen={play.phase === "playing"}
                onOpen={(char) => update(openDaily(play, char))}
              />
              {play.phase === "playing" ? (
                <>
                  <View style={styles.answerRow}>
                    <TextInput
                      accessibilityLabel="答え"
                      style={styles.input}
                      placeholder="答えを入力"
                      value={answer}
                      onChangeText={setAnswer}
                      onSubmitEditing={submit}
                      returnKeyType="done"
                    />
                    <Pressable
                      style={[
                        styles.answerButton,
                        !answer.trim() && styles.disabled,
                      ]}
                      silent
                      disabled={!answer.trim()}
                      onPress={submit}
                    >
                      <Text style={styles.primaryText}>回答</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.secondary}
                    onPress={() => update(giveUpDaily(play))}
                  >
                    <Text style={styles.secondaryText}>
                      ギブアップして答えを見る
                    </Text>
                  </Pressable>
                </>
              ) : (
                <DailyDone
                  play={play}
                  trivia={load.daily.trivia}
                  canEnter={load.daily.isToday}
                  memory={memory}
                  onMemory={(next) => {
                    setMemory(next);
                    void writeDailyMemory(next);
                  }}
                />
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
