import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

import { shakeTranslateX, USE_NATIVE_DRIVER } from "../components/motion";
import { MiniBoard, type MiniCell } from "./MiniBoard";
import { sceneStyles as styles } from "./sceneStyles";
import { colors } from "../theme/colors";

type SceneProps = { active: boolean; reduced: boolean };

const KANA = ["か", "き", "く", "さ", "し", "す", "た", "ち", "つ"];

function timing(value: Animated.Value, toValue: number, duration = 320) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: USE_NATIVE_DRIVER,
  });
}

// Runs `build()` in a loop while the page is on screen. With reduced
// motion the values jump to `still` instead.
function useLoop(
  { active, reduced }: SceneProps,
  values: Animated.Value[],
  build: () => Animated.CompositeAnimation,
  still: number[],
) {
  useEffect(() => {
    values.forEach((value) => value.setValue(0));
    if (!active) return;
    if (reduced) {
      values.forEach((value, i) => value.setValue(still[i] ?? 1));
      return;
    }
    const loop = Animated.loop(build());
    loop.start();
    return () => loop.stop();
    // The values and builders are created once per scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduced]);
}

function useCells(spec: Omit<MiniCell, "open">[]): MiniCell[] {
  return useMemo(
    () => spec.map((cell) => ({ ...cell, open: new Animated.Value(0) })),
    // Each scene's board is fixed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

// A finger that moves onto the target and taps.
function Finger({ tap, style }: { tap: Animated.Value; style?: object }) {
  const translateY = tap.interpolate({
    inputRange: [0, 0.6, 0.8, 1],
    outputRange: [40, 0, 4, 0],
  });
  const opacity = tap.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 1],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.finger, style, { opacity, transform: [{ translateY }] }]}
    >
      <MaterialIcons name="touch-app" size={34} color="#3b4f5c" />
    </Animated.View>
  );
}

export function AnswerScene(props: SceneProps) {
  const [typed, setTyped] = useState(props.reduced ? "うさぎ" : "");
  const press = useMemo(() => new Animated.Value(0), []);
  const win = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    if (!props.active || props.reduced) return;
    let step = 0;
    const timer = setInterval(() => {
      step = (step + 1) % 9;
      setTyped("うさぎ".slice(0, Math.min(step, 3)));
    }, 380);
    return () => clearInterval(timer);
  }, [props.active, props.reduced]);
  useLoop(
    props,
    [press, win],
    () =>
      Animated.sequence([
        Animated.delay(1250),
        timing(press, 1, 160),
        timing(press, 0, 160),
        timing(win, 1, 260),
        Animated.delay(1200),
        timing(win, 0, 200),
        Animated.delay(250),
      ]),
    [0, 1],
  );
  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.93],
  });
  return (
    <View style={styles.scene}>
      <Text style={styles.mockPrompt}>3文字の動物</Text>
      <View style={styles.mockInput}>
        <Text style={styles.mockInputText}>{typed}</Text>
        <View style={styles.caret} />
      </View>
      <Animated.View style={[styles.mockButton, { transform: [{ scale }] }]}>
        <Text style={styles.mockButtonText}>回答する</Text>
      </Animated.View>
      <Animated.View style={[styles.badge, { opacity: win }]}>
        <Text style={styles.badgeText}>正解なら勝ち！</Text>
      </Animated.View>
    </View>
  );
}

export function OpenScene(props: SceneProps) {
  const cells = useCells(KANA.map((char) => ({ char, count: 2 })));
  const tap = useMemo(() => new Animated.Value(0), []);
  const center = cells[4]!.open;
  useLoop(
    props,
    [tap, center],
    () =>
      Animated.sequence([
        timing(tap, 1, 600),
        timing(center, 1, 380),
        timing(tap, 0, 200),
        Animated.delay(1600),
        timing(center, 0, 1),
        Animated.delay(300),
      ]),
    [0, 1],
  );
  return (
    <View style={styles.scene}>
      <View>
        <MiniBoard cells={cells} />
        <Finger tap={tap} style={styles.fingerCenter} />
      </View>
      <Text style={styles.caption}>
        「し」の周りに答えの文字が <Text style={styles.em}>2</Text> 個
      </Text>
    </View>
  );
}

export function ChainScene(props: SceneProps) {
  const cells = useCells(KANA.map((char) => ({ char, count: 0 })));
  const tap = useMemo(() => new Animated.Value(0), []);
  const ring = [0, 1, 2, 5, 8, 7, 6, 3];
  useLoop(
    props,
    [tap, ...cells.map((cell) => cell.open)],
    () =>
      Animated.sequence([
        timing(tap, 1, 600),
        timing(cells[4]!.open, 1, 300),
        timing(tap, 0, 150),
        Animated.stagger(
          70,
          ring.map((i) => timing(cells[i]!.open, 1, 280)),
        ),
        Animated.delay(1500),
        Animated.parallel(cells.map((cell) => timing(cell.open, 0, 1))),
        Animated.delay(300),
      ]),
    [0, ...cells.map(() => 1)],
  );
  return (
    <View style={styles.scene}>
      <View>
        <MiniBoard cells={cells} />
        <Finger tap={tap} style={styles.fingerCenter} />
      </View>
      <Text style={styles.caption}>
        <Text style={styles.em}>0</Text> なら周りの安全なマスが一気に開く
      </Text>
    </View>
  );
}

export function MineScene(props: SceneProps) {
  const cells = useCells(
    KANA.map((char, i) => ({ char, mine: i === 4, count: 1 })),
  );
  const tap = useMemo(() => new Animated.Value(0), []);
  const shake = useMemo(() => new Animated.Value(0), []);
  const center = cells[4]!.open;
  useLoop(
    props,
    [tap, center, shake],
    () =>
      Animated.sequence([
        timing(tap, 1, 600),
        timing(center, 1, 380),
        timing(tap, 0, 150),
        timing(shake, 1, 420),
        timing(shake, 0, 1),
        Animated.delay(1500),
        timing(center, 0, 1),
        Animated.delay(300),
      ]),
    [0, 1, 0],
  );
  const translateX = shakeTranslateX(shake);
  return (
    <View style={styles.scene}>
      <Animated.View style={{ transform: [{ translateX }] }}>
        <MiniBoard cells={cells} />
        <Finger tap={tap} style={styles.fingerCenter} />
      </Animated.View>
      <Text style={styles.caption}>
        答えの文字は<Text style={styles.mine}>地雷</Text>
        。次の自分の番は回答できない
      </Text>
    </View>
  );
}

export function HelpScene(props: SceneProps) {
  const tap = useMemo(() => new Animated.Value(0), []);
  const glow = useMemo(() => new Animated.Value(0), []);
  useLoop(
    props,
    [tap, glow],
    () =>
      Animated.sequence([
        timing(tap, 1, 600),
        timing(glow, 1, 220),
        timing(glow, 0, 220),
        timing(glow, 1, 220),
        timing(glow, 0, 220),
        timing(tap, 0, 250),
        Animated.delay(700),
      ]),
    [0, 1],
  );
  const scale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  return (
    <View style={styles.scene}>
      <View style={styles.mockTop}>
        <Text style={styles.mockPromptSmall}>5文字の動物</Text>
        <View style={styles.mockChange}>
          <Text style={styles.mockChangeText}>条件を変える</Text>
        </View>
      </View>
      <View style={styles.mockHelpRow}>
        <Animated.View style={[styles.mockHelp, { transform: [{ scale }] }]}>
          <MaterialIcons name="help-outline" size={16} color={colors.help} />
          <Text style={styles.mockHelpText}>ルール</Text>
        </Animated.View>
        <Finger tap={tap} style={styles.fingerHelp} />
      </View>
    </View>
  );
}
