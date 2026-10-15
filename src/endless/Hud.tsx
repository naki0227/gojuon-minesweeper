import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import { Text, View } from "react-native";

import { SoundButton } from "../sound/SoundButton";
import { GemChip } from "../wallet/GemSheet";
import type { useGemWallet } from "../wallet/useGemWallet";
import type { EndlessState } from "./engine";
import { styles } from "./styles";
import { tr } from "../i18n";
import { Pressable } from "../components/TapPressable";

const S = tr({
  ja: {
    backHome: "ホームへ戻る",
    home: "ホーム",
    score: "スコア",
    cleared: "クリア",
    solved: (count: number) => `${count}問`,
    lives: "ライフ",
    livesLabel: (lives: number) => `ライフ ${lives}`,
  },
  en: {
    backHome: "Back to home",
    home: "Home",
    score: "Score",
    cleared: "Solved",
    solved: (count: number) => `${count}`,
    lives: "Lives",
    livesLabel: (lives: number) =>
      `${lives} ${lives === 1 ? "life" : "lives"} left`,
  },
});

type Props = {
  game: EndlessState | null;
  wallet: ReturnType<typeof useGemWallet>;
};

// Top bar (home, mode, gems) and one slim row of score, clears and lives.
export function EndlessHud({ game, wallet }: Props) {
  return (
    <>
      <View style={styles.top}>
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={S.backHome}
            style={styles.exit}
            hitSlop={8}
          >
            <MaterialIcons name="arrow-back-ios" size={16} color="#546d7a" />
            <Text style={styles.exitText}>{S.home}</Text>
          </Pressable>
        </Link>
        <Text style={styles.eyebrow}>ENDLESS</Text>
        <View style={styles.topRight}>
          <SoundButton />
          <GemChip wallet={wallet} />
        </View>
      </View>
      {game ? (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statCaption}>{S.score}</Text>
            <Text style={styles.statValue}>{game.score.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statCaption}>{S.cleared}</Text>
            <Text style={styles.statValue}>{S.solved(game.solved)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statCaption}>{S.lives}</Text>
            <View
              style={styles.lives}
              accessible
              accessibilityLabel={S.livesLabel(game.lives)}
            >
              {[0, 1, 2].map((i) => (
                <MaterialIcons
                  key={i}
                  name={i < game.lives ? "favorite" : "favorite-border"}
                  size={18}
                  color="#d2475a"
                />
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}
