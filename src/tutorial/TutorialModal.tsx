import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useReducedMotion } from "../components/motion";
import { Popup } from "../components/Popup";
import {
  AnswerScene,
  ChainScene,
  HelpScene,
  MineScene,
  OpenScene,
} from "./scenes";

type Page = {
  title: string;
  body: string;
  Scene: ComponentType<{ active: boolean; reduced: boolean }>;
};

const PAGES: readonly Page[] = [
  {
    title: "答えを予想して回答",
    body: "お題の言葉を予想して入力。当たれば勝ち。自信がなければ回答せずに進めます。",
    Scene: AnswerScene,
  },
  {
    title: "1文字開いてヒント",
    body: "回答のあとに1マス開きます。数字は周り8マスにある答えの文字の数（重複込み）。",
    Scene: OpenScene,
  },
  {
    title: "0なら連鎖",
    body: "周りに答えの文字がなければ、安全なマスがまとめて開きます。",
    Scene: ChainScene,
  },
  {
    title: "地雷に注意",
    body: "答えに含まれる文字を開くと地雷。次の自分の番は回答できません。",
    Scene: MineScene,
  },
  {
    title: "ルールはいつでも",
    body: "対戦中も「ルール」を押すと、この説明をもう一度見られます。",
    Scene: HelpScene,
  },
];

const SEEN_KEY = "tutorial.v1.seen";

// Opens the tutorial once on the first launch of the app (not on web,
// which shows the rules as text).
export function useFirstRunTutorial() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS === "web") return;
    void AsyncStorage.getItem(SEEN_KEY)
      .then((seen) => {
        if (!seen) setVisible(true);
      })
      .catch(() => {});
  }, []);
  const close = () => {
    setVisible(false);
    void AsyncStorage.setItem(SEEN_KEY, "1").catch(() => {});
  };
  return { visible, close };
}

// A popup of swipeable pages, each showing one rule as a short animation.
export function TutorialModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const pager = useRef<ScrollView>(null);
  const last = page === PAGES.length - 1;

  const goTo = (next: number) => {
    setPage(next);
    pager.current?.scrollTo({ x: next * width, animated: true });
  };
  const close = () => {
    onClose();
    setPage(0);
  };

  return (
    <Popup
      visible={visible}
      cardStyle={styles.card}
      onCardLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          width > 0 &&
          setPage(Math.round(event.nativeEvent.contentOffset.x / width))
        }
      >
        {width > 0
          ? PAGES.map(({ title, body, Scene }, index) => (
              <View key={title} style={[styles.page, { width }]}>
                <Text style={styles.step}>
                  {index + 1} / {PAGES.length}
                </Text>
                <Scene active={visible && index === page} reduced={reduced} />
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.body}>{body}</Text>
              </View>
            ))
          : null}
      </ScrollView>
      <View style={styles.dots}>
        {PAGES.map(({ title }, index) => (
          <View
            key={title}
            style={[styles.dot, index === page && styles.dotActive]}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={close}
          hitSlop={8}
          style={styles.skip}
        >
          <Text style={styles.skipText}>{last ? "" : "スキップ"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => (last ? close() : goTo(page + 1))}
          style={styles.next}
        >
          <Text style={styles.nextText}>{last ? "はじめる" : "次へ"}</Text>
        </Pressable>
      </View>
    </Popup>
  );
}

const styles = StyleSheet.create({
  card: { paddingBottom: 16 },
  page: { paddingHorizontal: 22, paddingTop: 16, gap: 8 },
  step: { color: "#8a9aa5", fontSize: 11, fontWeight: "800" },
  title: { color: "#102433", fontSize: 20, fontWeight: "900" },
  body: { color: "#516775", fontSize: 14, lineHeight: 21, minHeight: 63 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#d5dee4" },
  dotActive: { width: 18, backgroundColor: "#3388b0" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  skip: { minWidth: 72, paddingVertical: 10 },
  skipText: { color: "#7b8992", fontSize: 14, fontWeight: "700" },
  next: {
    minWidth: 120,
    borderRadius: 999,
    backgroundColor: "#3388b0",
    paddingVertical: 11,
    alignItems: "center",
  },
  nextText: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
});
