import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, TextInput, View } from "react-native";

import { maskedAnswer } from "../game/engine";
import { EndlessBoard } from "./EndlessBoard";
import {
  isExhausted,
  LETTER_HINT_PENALTY,
  safeHintCandidate,
  type EndlessState,
} from "./engine";
import { styles } from "./styles";
import { tr } from "../i18n";
import { colors } from "../theme/colors";
import { Pressable } from "../components/TapPressable";

const S = tr({
  ja: {
    answerLetters: "答えの文字",
    answerLabel: "答えを入力",
    openOne: "マスを1つ開こう",
    submit: "回答",
    showLetter: (penalty: number) => `1文字見る（-${penalty}）`,
    pass: "回答せず開く",
    hintLabel: "1ジェムで安全なマスを緑色で表示",
    safeCell: "安全マス",
  },
  en: {
    answerLetters: "Answer",
    answerLabel: "Type your answer",
    openOne: "Open a cell",
    submit: "Answer",
    showLetter: (penalty: number) => `Show a letter (-${penalty})`,
    pass: "Pass and open",
    hintLabel: "Show a safe cell in green for 1 gem",
    safeCell: "Safe cell",
  },
});

type Props = {
  game: EndlessState;
  answer: string;
  onChangeAnswer: (value: string) => void;
  onSubmit: () => void;
  onPass: () => void;
  onOpen: (char: string) => void;
  mineChars: ReadonlySet<string>;
  hintedChars: ReadonlySet<string>;
  busy: boolean;
  gemBalance: number | null;
  onHint: () => void;
};

// Board on top, then one row to answer and one row of moves, so a whole
// turn fits on one phone screen.
export function PlayPanel({
  game,
  answer,
  onChangeAnswer,
  onSubmit,
  onPass,
  onOpen,
  mineChars,
  hintedChars,
  busy,
  gemBalance,
  onHint,
}: Props) {
  if (game.phase !== "answer" && game.phase !== "open") return null;
  const canAnswer = game.phase === "answer";
  const exhausted = isExhausted(game);
  const canHint =
    !busy &&
    !!safeHintCandidate(game) &&
    gemBalance !== null &&
    gemBalance >= 1;
  return (
    <>
      <EndlessBoard
        game={game}
        mineChars={mineChars}
        hintedChars={hintedChars}
        onOpen={onOpen}
      />
      {exhausted ? (
        <View style={styles.letterHint}>
          <Text style={styles.letterHintCaption}>{S.answerLetters}</Text>
          <Text
            style={[
              styles.letterHintText,
              // Long answers shrink so up to 15 letters fit on one line.
              { fontSize: game.question.length > 9 ? 16 : 22 },
              { letterSpacing: game.question.length > 9 ? 1 : 4 },
            ]}
          >
            {maskedAnswer(game.question, game.revealedLetters)}
          </Text>
        </View>
      ) : null}
      <View style={styles.answerRow}>
        <TextInput
          accessibilityLabel={S.answerLabel}
          style={[styles.input, !canAnswer && styles.disabled]}
          placeholder={canAnswer ? S.answerLabel : S.openOne}
          value={answer}
          editable={canAnswer}
          onChangeText={onChangeAnswer}
          onSubmitEditing={onSubmit}
          returnKeyType="done"
        />
        <Pressable
          style={[
            styles.answerButton,
            (!canAnswer || !answer.trim()) && styles.disabled,
          ]}
          silent
          disabled={!canAnswer || !answer.trim()}
          onPress={onSubmit}
        >
          <Text style={styles.primaryText}>{S.submit}</Text>
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.secondary, !canAnswer && styles.disabled]}
          disabled={!canAnswer}
          onPress={onPass}
        >
          <Text style={styles.secondaryText}>
            {exhausted ? S.showLetter(LETTER_HINT_PENALTY) : S.pass}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={S.hintLabel}
          style={[styles.secondary, !canHint && styles.disabled]}
          disabled={!canHint}
          onPress={onHint}
        >
          <View style={styles.iconLabel}>
            <MaterialIcons name="diamond" size={15} color={colors.gem} />
            <Text style={styles.secondaryText}>1</Text>
            <Text style={styles.secondaryText}>{S.safeCell}</Text>
          </View>
        </Pressable>
      </View>
    </>
  );
}
