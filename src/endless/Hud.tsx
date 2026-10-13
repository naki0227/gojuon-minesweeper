import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import { Text, View } from "react-native";

import { SoundButton } from "../sound/SoundButton";
import { GemChip } from "../wallet/GemSheet";
import type { useGemWallet } from "../wallet/useGemWallet";
import type { EndlessState } from "./engine";
import { styles } from "./styles";
import { Pressable } from "../components/TapPressable";

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
            accessibilityLabel="ホームへ戻る"
            style={styles.exit}
            hitSlop={8}
          >
            <MaterialIcons name="arrow-back-ios" size={16} color="#546d7a" />
            <Text style={styles.exitText}>ホーム</Text>
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
            <Text style={styles.statCaption}>スコア</Text>
            <Text style={styles.statValue}>{game.score.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statCaption}>クリア</Text>
            <Text style={styles.statValue}>{game.solved}問</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statCaption}>ライフ</Text>
            <View
              style={styles.lives}
              accessible
              accessibilityLabel={`ライフ ${game.lives}`}
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
