import { Pressable, Text, TextInput, View } from "react-native";

import { CharacterBoard } from "../components/CharacterBoard";
import { adjacentMineCount, questionMineMultiplicity } from "../game/engine";
import type { EndlessState } from "./engine";
import { styles } from "./styles";

type Props = {
  game: EndlessState;
  answer: string;
  onChangeAnswer: (value: string) => void;
  onSubmit: () => void;
  onPass: () => void;
  onOpen: (char: string) => void;
  mineChars: ReadonlySet<string>;
  hintedChars: ReadonlySet<string>;
};

export function PlayPanel({
  game,
  answer,
  onChangeAnswer,
  onSubmit,
  onPass,
  onOpen,
  mineChars,
  hintedChars,
}: Props) {
  if (game.phase !== "answer" && game.phase !== "open") return null;
  const canAnswer = game.phase === "answer";
  return (
    <>
      <TextInput
        accessibilityLabel="答えを入力"
        style={styles.input}
        placeholder={canAnswer ? "答えを入力" : "1マス開いてください"}
        value={answer}
        editable={canAnswer}
        onChangeText={onChangeAnswer}
        onSubmitEditing={onSubmit}
      />
      <View style={styles.actions}>
        <Pressable
          style={[
            styles.primary,
            (!canAnswer || !answer.trim()) && styles.disabled,
          ]}
          disabled={!canAnswer || !answer.trim()}
          onPress={onSubmit}
        >
          <Text style={styles.primaryText}>回答する</Text>
        </Pressable>
        <Pressable
          style={[styles.secondary, !canAnswer && styles.disabled]}
          disabled={!canAnswer}
          onPress={onPass}
        >
          <Text style={styles.secondaryText}>回答せず開く</Text>
        </Pressable>
      </View>
      <CharacterBoard
        language={game.question.language}
        openedChars={game.opened}
        hintedChars={hintedChars}
        mineChars={mineChars}
        mineCount={(char) => adjacentMineCount(game.question, char)}
        mineMultiplicity={(char) =>
          questionMineMultiplicity(game.question, char)
        }
        canOpen={game.phase === "open"}
        onOpen={onOpen}
      />
      <Text style={styles.micro}>
        ヒント：緑色のマスは安全。タップした時に初めて数字が分かります。
      </Text>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>ジェムのヒント（1個）</Text>
        <Text style={styles.noticeText}>
          安全な未開封マスを1つ表示。購入・残高同期の実装後に有効になります。
        </Text>
      </View>
    </>
  );
}
