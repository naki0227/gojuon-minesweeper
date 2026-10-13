import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useReducedMotion } from "../components/motion";
import { Popup } from "../components/Popup";
import {
  AnswerScene,
  ChainScene,
  HelpScene,
  MineScene,
  OpenScene,
} from "./scenes";
import { HELP_STEP, RULE_STEPS } from "./rules";
import { colors } from "../theme/colors";
import { buttonStyles } from "../components/buttonStyles";

type Page = {
  title: string;
  body: string;
  Scene: ComponentType<{ active: boolean; reduced: boolean }>;
};

const PAGES: readonly Page[] = [
  ...RULE_STEPS.map((step, index) => ({
    ...step,
    Scene: [AnswerScene, OpenScene, ChainScene, MineScene][index]!,
  })),
  { ...HELP_STEP, Scene: HelpScene },
];

const SEEN_KEY = "tutorial.v1.seen";

// Opens the tutorial once, on the first launch of the app or the first
// visit to the website.
export function useFirstRunTutorial() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
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
        style={styles.pager}
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
  // No focus ring around the pager on the web.
  pager: { outlineWidth: 0 },
  page: { paddingHorizontal: 22, paddingTop: 16, gap: 8 },
  step: { color: "#8a9aa5", fontSize: 11, fontWeight: "800" },
  title: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  body: { color: "#516775", fontSize: 14, lineHeight: 21, minHeight: 63 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
  dotActive: { width: 18, backgroundColor: colors.primary },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  skip: { minWidth: 72, paddingVertical: 10 },
  skipText: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  next: { ...buttonStyles.primaryButton, minWidth: 120, borderRadius: 999 },
  nextText: buttonStyles.primaryButtonText,
});
