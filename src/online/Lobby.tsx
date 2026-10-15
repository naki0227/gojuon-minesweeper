import { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";

import type { QuestionFilters } from "../data/types";
import { tr } from "../i18n";
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

const S = tr({
  ja: {
    languages: { ja: "日本語", en: "English", any: "まぜる" },
    inviteTitle: "友だちを招待",
    inviteHelp:
      "招待リンクを送るだけ。相手がリンクを開くと対戦がはじまります（アプリがなくてもブラウザで遊べます）。",
    makeInvite: "招待リンクを作る",
    codeTitle: "合言葉で友だちと対戦",
    codeHelp:
      "ふたりで同じ合言葉を入れると対戦がはじまります。先に入った人のジャンルと文字数で出題します。",
    codeLabel: "合言葉",
    codePlaceholder: "合言葉（2〜16文字）",
    joinCode: "この合言葉で対戦",
    quickTitle: "ランダムマッチ",
    quickHelp: (language: string) =>
      `同じ言語を選んだ誰かと対戦します（${language}・ぜんぶのジャンル）。`,
    findOpponent: "相手を探す",
    waitingCode: (code: string | null) =>
      `合言葉「${code}」で相手を待っています`,
    searching: "相手を探しています…",
    waitingCodeHelp: "相手にも同じ合言葉を入れてもらってください。",
    searchingHelp: "見つかると自動で対戦がはじまります。",
    sendInvite: "招待リンクを送る",
    copied: "リンクをコピーしました",
    cancel: "やめる",
  },
  en: {
    languages: { ja: "Japanese", en: "English", any: "Mixed" },
    inviteTitle: "Invite a friend",
    inviteHelp:
      "Just send an invite link. The game starts when your friend opens it (no app needed, it works in the browser too).",
    makeInvite: "Create invite link",
    codeTitle: "Play a friend with a room code",
    codeHelp:
      "Enter the same room code to start a game together. The first player's genres and word length are used.",
    codeLabel: "Room code",
    codePlaceholder: "Room code (2-16 characters)",
    joinCode: "Play with this code",
    quickTitle: "Quick match",
    quickHelp: (language: string) =>
      `Play someone who picked the same language (${language}, all genres).`,
    findOpponent: "Find an opponent",
    waitingCode: (code: string | null) =>
      `Waiting for an opponent with room code "${code}"`,
    searching: "Looking for an opponent…",
    waitingCodeHelp: "Ask your friend to enter the same room code.",
    searchingHelp: "The game starts automatically once someone is found.",
    sendInvite: "Send invite link",
    copied: "Link copied",
    cancel: "Cancel",
  },
});

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
        <Text style={styles.panelTitle}>{S.inviteTitle}</Text>
        <Text style={styles.helperText}>{S.inviteHelp}</Text>
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
          <Text style={styles.primaryButtonText}>{S.makeInvite}</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{S.codeTitle}</Text>
        <Text style={styles.helperText}>{S.codeHelp}</Text>
        <TextInput
          accessibilityLabel={S.codeLabel}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={ROOM_CODE_MAX_LENGTH * 2}
          onChangeText={setCode}
          onSubmitEditing={() =>
            validCode && !online.busy
              ? void online.run({ action: "join_code", code, filters })
              : undefined
          }
          placeholder={S.codePlaceholder}
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
          <Text style={styles.primaryButtonText}>{S.joinCode}</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{S.quickTitle}</Text>
        <Text style={styles.helperText}>
          {S.quickHelp(S.languages[filters.language])}
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
          <Text style={styles.primaryButtonText}>{S.findOpponent}</Text>
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
        {room.kind === "code" ? S.waitingCode(room.code) : S.searching}
      </Text>
      <Text style={styles.helperText}>
        {room.kind === "code" ? S.waitingCodeHelp : S.searchingHelp}
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
            <Text style={styles.primaryButtonText}>{S.sendInvite}</Text>
          </Pressable>
          {shared === "copied" ? (
            <Text style={styles.note}>{S.copied}</Text>
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
        <Text style={styles.secondaryButtonText}>{S.cancel}</Text>
      </Pressable>
    </View>
  );
}
