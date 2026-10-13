import { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";

import type { QuestionFilters } from "../data/types";
import { colors } from "../theme/colors";
import { randomInviteCode } from "./invite";
import { lobbyStyles as styles } from "./lobbyStyles";
import {
  normalizeRoomCode,
  ROOM_CODE_MAX_LENGTH,
  type OnlineRoom,
} from "./protocol";
import { shareInvite, type ShareResult } from "./shareInvite";
import type { useOnlineRoom } from "./useOnlineRoom";
import { Pressable } from "../components/TapPressable";

type Online = ReturnType<typeof useOnlineRoom>;

const LANGUAGE_LABELS = {
  ja: "日本語",
  en: "English",
  any: "まぜる",
} as const;

// Before a room exists: invite a friend, join by code or find a match.
export function Lobby({
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
        <Text style={styles.panelTitle}>友だちを招待</Text>
        <Text style={styles.helperText}>
          招待リンクを送るだけ。相手がリンクを開くと対戦がはじまります（アプリがなくてもブラウザで遊べます）。
        </Text>
        <Pressable
          disabled={online.busy}
          onPress={() =>
            void online.run({
              action: "join_code",
              code: randomInviteCode(),
              filters,
            })
          }
          style={({ pressed }) => [
            styles.primaryButton,
            online.busy && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>招待リンクを作る</Text>
        </Pressable>
      </View>

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
      {online.busy ? <ActivityIndicator color={colors.primary} /> : null}
    </>
  );
}

export function Waiting({
  room,
  online,
}: {
  room: OnlineRoom;
  online: Online;
}) {
  const [shared, setShared] = useState<ShareResult | null>(null);
  return (
    <View style={styles.panel}>
      <ActivityIndicator color={colors.primary} />
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
      {room.kind === "code" && room.code ? (
        <>
          <Pressable
            onPress={async () => setShared(await shareInvite(room.code!))}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressedButton,
            ]}
          >
            <Text style={styles.primaryButtonText}>招待リンクを送る</Text>
          </Pressable>
          {shared === "copied" ? (
            <Text style={styles.note}>リンクをコピーしました</Text>
          ) : null}
        </>
      ) : null}
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
