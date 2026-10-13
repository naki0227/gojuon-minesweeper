import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Head from "expo-router/head";
import { router, useLocalSearchParams } from "expo-router";

import { PinnedBannerScreen } from "../src/ads/PinnedBannerScreen";
import { matchBanner } from "../src/ads/types";
import { CharacterBoard } from "../src/components/CharacterBoard";
import { RuleHelp } from "../src/components/RuleHelp";
import type { QuestionFilters } from "../src/data/types";
import { isOnlineConfigured } from "../src/online/client";
import { joinCodeFromParam } from "../src/online/invite";
import type { OnlineRoom } from "../src/online/protocol";
import { Lobby, Waiting } from "../src/online/Lobby";
import { lobbyStyles } from "../src/online/lobbyStyles";
import { useOnlineRoom } from "../src/online/useOnlineRoom";
import { colors } from "../src/theme/colors";
import { noteWinForReview } from "../src/review/askForReview";

const DEFAULT_FILTERS: QuestionFilters = {
  language: "ja",
  categories: [],
  length: "any",
};

function parseFilters(raw: string | string[] | undefined): QuestionFilters {
  if (typeof raw !== "string") {
    return DEFAULT_FILTERS;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<QuestionFilters>;
    return { ...DEFAULT_FILTERS, ...parsed };
  } catch {
    return DEFAULT_FILTERS;
  }
}

// The server writes "Player 1" / "Player 2"; each device reads them as
// "あなた" / "相手".
function personalize(text: string, seat: number | null): string {
  return text.replace(/Player ([12])\s?/g, (_match, number: string) =>
    Number(number) - 1 === seat ? "あなた" : "相手",
  );
}

export default function OnlineScreen() {
  const params = useLocalSearchParams<{ filters?: string; join?: string }>();
  const filters = useMemo(() => parseFilters(params.filters), [params.filters]);
  const online = useOnlineRoom();
  const { room } = online;

  // An invite link (/online?join=code) joins that room once on arrival.
  const joinCode = joinCodeFromParam(params.join);
  const joined = useRef<string | null>(null);
  useEffect(() => {
    if (!isOnlineConfigured || !joinCode || joined.current === joinCode) return;
    joined.current = joinCode;
    router.setParams({ join: undefined });
    void online.run({ action: "join_code", code: joinCode, filters });
  }, [joinCode, filters, online]);

  function goHome() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  let body: ReactNode;
  if (!isOnlineConfigured) {
    body = (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>オンライン対戦は準備中です</Text>
        <Text style={styles.helperText}>
          このビルドにはサーバーの設定が入っていません。
        </Text>
      </View>
    );
  } else if (!room || (room.status === "closed" && !room.public_state)) {
    body = <Lobby filters={filters} online={online} />;
  } else if (room.status === "waiting") {
    body = <Waiting room={room} online={online} />;
  } else {
    body = <OnlineGame room={room} online={online} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Head>
        <title>オンライン対戦 | 五十音マインスイーパー</title>
      </Head>
      <PinnedBannerScreen
        banner={
          room &&
          (room.status === "waiting" ||
            room.status === "playing" ||
            room.public_state?.phase === "finished")
            ? matchBanner(room.public_state?.phase, room.status)
            : null
        }
        layoutKey={`${room?.id}:${room?.status}:${room?.public_state?.prompt}`}
        contentStyle={styles.page}
      >
        {room?.status !== "playing" ? (
          <View style={styles.topBar}>
            <Text style={styles.eyebrow}>オンライン対戦</Text>
            {!room || room.status === "closed" ? (
              <Pressable onPress={goHome} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>ホームへ</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {body}
        {online.error ? (
          <Pressable onPress={online.clearError} style={styles.errorPanel}>
            <Text style={styles.errorText}>{online.error}</Text>
          </Pressable>
        ) : null}
      </PinnedBannerScreen>
    </SafeAreaView>
  );
}

type Online = ReturnType<typeof useOnlineRoom>;

function OnlineGame({ room, online }: { room: OnlineRoom; online: Online }) {
  const [answer, setAnswer] = useState("");
  const state = room.public_state;
  const { seat } = online;
  const iWon = room.status === "finished" && state?.winner === seat;
  useEffect(() => {
    if (iWon) void noteWinForReview();
  }, [iWon]);
  const mineChars = useMemo(
    () => new Set(state?.mineChars ?? []),
    [state?.mineChars],
  );

  if (!state) {
    return (
      <View style={styles.panel}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.panelTitle}>対戦を準備しています…</Text>
      </View>
    );
  }

  const myTurn = room.status === "playing" && state.currentPlayer === seat;
  const canAnswer = myTurn && state.phase === "answer" && !online.busy;
  const canOpen = myTurn && state.phase === "open" && !online.busy;
  const finished = state.phase === "finished";
  const iRequestedRematch = seat !== null && room.rematch[seat] === true;
  const opponentRequestedRematch =
    seat !== null && room.rematch[seat === 0 ? 1 : 0] === true;

  async function sendAnswer() {
    const next = await online.run({
      action: "move",
      roomId: room.id,
      move: { type: "answer", text: answer },
    });
    if (next) {
      setAnswer("");
    }
  }

  async function leave() {
    await online.run({ action: "leave", roomId: room.id });
    online.reset();
  }

  const resultTitle =
    state.winner === null
      ? "引き分け！"
      : state.winner === seat
        ? "あなたの勝ち！"
        : "相手の勝ち";

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.prompt}>{state.prompt}</Text>
        <RuleHelp kana={state.language === "ja"} />
      </View>

      {!finished ? (
        <View style={[styles.turnPanel, myTurn && styles.turnPanelMine]}>
          <View style={styles.turnWho}>
            <Text style={styles.turnCaption}>手番</Text>
            <Text style={styles.turnPlayer}>{myTurn ? "あなた" : "相手"}</Text>
          </View>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>
              {state.phase === "answer" ? "回答" : "1文字開く"}
              {online.secondsLeft !== null
                ? `・残り${online.secondsLeft}秒`
                : ""}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.messagePanel}>
        <Text style={styles.message}>
          {personalize(state.lastMessage, seat)}
        </Text>
      </View>

      {state.hint ? (
        <View style={styles.messagePanel}>
          <Text style={styles.message}>答えの文字：{state.hint}</Text>
        </View>
      ) : null}

      {finished ? (
        <View style={styles.panel}>
          <Text style={styles.resultTitle}>{resultTitle}</Text>
          {state.answers ? (
            <Text style={styles.resultAnswer}>
              答え：{state.answers.join(" / ")}
            </Text>
          ) : null}
          {room.status === "finished" ? (
            <>
              <Pressable
                disabled={iRequestedRematch || online.busy}
                onPress={() =>
                  void online.run({ action: "rematch", roomId: room.id })
                }
                style={[
                  styles.primaryButton,
                  (iRequestedRematch || online.busy) && styles.disabledButton,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {iRequestedRematch ? "相手を待っています…" : "もう一戦"}
                </Text>
              </Pressable>
              {opponentRequestedRematch && !iRequestedRematch ? (
                <Text style={styles.helperText}>
                  相手がもう一戦を希望しています。
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.helperText}>相手が退出しました。</Text>
          )}
          <Pressable
            onPress={() => void leave()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>部屋を出る</Text>
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
              onChangeText={setAnswer}
              onSubmitEditing={
                canAnswer && answer.trim() ? () => void sendAnswer() : undefined
              }
              placeholder={
                canAnswer
                  ? state.language === "ja"
                    ? "漢字・ひらがな・カタカナで回答"
                    : "英単語を入力"
                  : myTurn
                    ? "このターンは回答できません"
                    : "相手の手番です"
              }
              returnKeyType="done"
              style={[styles.input, !canAnswer && styles.inputDisabled]}
              value={answer}
            />
            <View style={styles.row}>
              <Pressable
                disabled={!canAnswer || !answer.trim()}
                onPress={() => void sendAnswer()}
                style={[
                  styles.primaryButton,
                  styles.grow,
                  (!canAnswer || !answer.trim()) && styles.disabledButton,
                ]}
              >
                <Text style={styles.primaryButtonText}>回答する</Text>
              </Pressable>
              <Pressable
                disabled={!canAnswer}
                onPress={() =>
                  void online.run({
                    action: "move",
                    roomId: room.id,
                    move: { type: "pass" },
                  })
                }
                style={[
                  styles.secondaryButton,
                  !canAnswer && styles.disabledButton,
                ]}
              >
                <Text style={styles.secondaryButtonText}>回答しない</Text>
              </Pressable>
            </View>
          </View>

          <CharacterBoard
            language={state.language}
            canOpen={canOpen}
            mineChars={mineChars}
            mineCount={(char) => state.mineCounts[char] ?? 0}
            mineMultiplicity={(char) => state.mineMultiplicities?.[char] ?? 1}
            onOpen={(char) =>
              void online.run({
                action: "move",
                roomId: room.id,
                move: { type: "open", char },
              })
            }
            openedChars={state.openedChars}
          />

          <Pressable onPress={() => void leave()} style={styles.textButton}>
            <Text style={styles.textButtonText}>
              降参して部屋を出る（相手の勝ちになります）
            </Text>
          </Pressable>
        </>
      )}
    </>
  );
}

const styles = {
  ...lobbyStyles,
  ...StyleSheet.create({
    page: {
      flexGrow: 1,
      width: "100%",
      maxWidth: 760,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
      gap: 10,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 38,
    },
    eyebrow: {
      color: colors.help,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 1,
    },
    smallButton: {
      minHeight: 38,
      justifyContent: "center",
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "#c4d1d9",
      borderRadius: 9,
      backgroundColor: colors.white,
    },
    smallButtonText: {
      color: "#526975",
      fontSize: 12,
      fontWeight: "800",
    },
    header: {
      gap: 6,
    },
    prompt: {
      color: colors.ink,
      fontSize: 24,
      fontWeight: "900",
      lineHeight: 30,
    },
    turnPanel: {
      backgroundColor: "#f1f4f6",
      borderColor: colors.line,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    turnPanelMine: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primaryBorder,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    grow: {
      flexGrow: 1,
    },
    textButton: {
      alignSelf: "center",
      paddingVertical: 8,
    },
    textButtonText: {
      color: colors.muted,
      fontSize: 12,
      textDecorationLine: "underline",
    },
    resultAnswer: {
      color: "#596d79",
      fontSize: 16,
    },
    errorPanel: {
      backgroundColor: "#fff0df",
      borderColor: colors.accent,
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
    },
    errorText: {
      color: "#8a4b12",
      fontSize: 13,
      lineHeight: 19,
    },
  }),
};
