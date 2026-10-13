import { useMemo, useState, type ReactNode } from "react";
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
import {
  normalizeRoomCode,
  ROOM_CODE_MAX_LENGTH,
  type OnlineRoom,
} from "../src/online/protocol";
import { useOnlineRoom } from "../src/online/useOnlineRoom";
import { matchStyles } from "../src/components/matchStyles";

const DEFAULT_FILTERS: QuestionFilters = {
  language: "ja",
  categories: [],
  length: "any",
};

const LANGUAGE_LABELS = {
  ja: "日本語",
  en: "English",
  any: "まぜる",
} as const;

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
  const params = useLocalSearchParams<{ filters?: string }>();
  const filters = useMemo(() => parseFilters(params.filters), [params.filters]);
  const online = useOnlineRoom();
  const { room } = online;

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

function Lobby({
  filters,
  online,
}: {
  filters: QuestionFilters;
  online: Online;
}) {
  const [code, setCode] = useState("");
  const validCode = normalizeRoomCode(code) !== null;

  return (
    <>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>合言葉で友だちと対戦</Text>
        <Text style={styles.helperText}>
          ふたりで同じ合言葉を入れると対戦がはじまります。先に入った人のジャンルと文字数で出題します。
        </Text>
        <TextInput
          accessibilityLabel="合言葉"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={ROOM_CODE_MAX_LENGTH * 2}
          onChangeText={setCode}
          onSubmitEditing={() =>
            validCode && !online.busy
              ? void online.run({ action: "join_code", code, filters })
              : undefined
          }
          placeholder="合言葉（2〜16文字）"
          returnKeyType="go"
          style={styles.input}
          value={code}
        />
        <Pressable
          disabled={!validCode || online.busy}
          onPress={() =>
            void online.run({ action: "join_code", code, filters })
          }
          style={({ pressed }) => [
            styles.primaryButton,
            (!validCode || online.busy) && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>この合言葉で対戦</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>ランダムマッチ</Text>
        <Text style={styles.helperText}>
          同じ言語を選んだ誰かと対戦します（{LANGUAGE_LABELS[filters.language]}
          ・ぜんぶのジャンル）。
        </Text>
        <Pressable
          disabled={online.busy}
          onPress={() =>
            void online.run({
              action: "quick_match",
              language: filters.language,
            })
          }
          style={({ pressed }) => [
            styles.primaryButton,
            online.busy && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>相手を探す</Text>
        </Pressable>
      </View>
      {online.busy ? <ActivityIndicator color="#3388b0" /> : null}
    </>
  );
}

function Waiting({ room, online }: { room: OnlineRoom; online: Online }) {
  return (
    <View style={styles.panel}>
      <ActivityIndicator color="#3388b0" />
      <Text style={styles.panelTitle}>
        {room.kind === "code"
          ? `合言葉「${room.code}」で相手を待っています`
          : "相手を探しています…"}
      </Text>
      <Text style={styles.helperText}>
        {room.kind === "code"
          ? "相手にも同じ合言葉を入れてもらってください。"
          : "見つかると自動で対戦がはじまります。"}
      </Text>
      <Pressable
        disabled={online.busy}
        onPress={async () => {
          const next = await online.run({ action: "cancel", roomId: room.id });
          if (next?.status === "closed") {
            online.reset();
          }
        }}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>やめる</Text>
      </Pressable>
    </View>
  );
}

function OnlineGame({ room, online }: { room: OnlineRoom; online: Online }) {
  const [answer, setAnswer] = useState("");
  const state = room.public_state;
  const { seat } = online;
  const mineChars = useMemo(
    () => new Set(state?.mineChars ?? []),
    [state?.mineChars],
  );

  if (!state) {
    return (
      <View style={styles.panel}>
        <ActivityIndicator color="#3388b0" />
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
  ...matchStyles,
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
      color: "#4285a8",
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
      backgroundColor: "#ffffff",
    },
    smallButtonText: {
      color: "#526975",
      fontSize: 12,
      fontWeight: "800",
    },
    panel: {
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#cfdce4",
      borderRadius: 14,
      padding: 18,
      gap: 10,
    },
    panelTitle: {
      color: "#173f55",
      fontSize: 18,
      fontWeight: "900",
    },
    helperText: {
      color: "#627481",
      fontSize: 13,
      lineHeight: 20,
    },
    header: {
      gap: 6,
    },
    prompt: {
      color: "#102433",
      fontSize: 24,
      fontWeight: "900",
      lineHeight: 30,
    },
    turnPanel: {
      backgroundColor: "#f1f4f6",
      borderColor: "#d5dee4",
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    turnPanelMine: {
      backgroundColor: "#eaf6fb",
      borderColor: "#bcddea",
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    grow: {
      flexGrow: 1,
    },
    primaryButton: {
      minHeight: 46,
      backgroundColor: "#3388b0",
      borderRadius: 10,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    textButton: {
      alignSelf: "center",
      paddingVertical: 8,
    },
    textButtonText: {
      color: "#7b8992",
      fontSize: 12,
      textDecorationLine: "underline",
    },
    resultAnswer: {
      color: "#596d79",
      fontSize: 16,
    },
    errorPanel: {
      backgroundColor: "#fff0df",
      borderColor: "#e98a2f",
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
