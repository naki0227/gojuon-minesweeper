import { useState, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { BannerAd } from "./BannerAd";
import type { BannerAdProps } from "./types";

// Room the banner itself may take (anchored adaptive banners are at most
// 90 px tall on phones), plus the play gap BannerAd adds above it while a
// match is on.
const BANNER_ROOM = 90;
const PLAY_GAP = 150;

type Props = {
  banner: BannerAdProps | null;
  // The page container: width, padding and gap between children.
  contentStyle: StyleProp<ViewStyle>;
  children: ReactNode;
};

// A scrolling screen with its banner pinned to the bottom when everything
// fits: during play only if the whole game plus the 150 px gap and the
// banner fit without scrolling, so a tap on the game can never land near
// the ad. Otherwise the banner sits at the end of the page as before.
export function PinnedBannerScreen({ banner, contentStyle, children }: Props) {
  const [screen, setScreen] = useState(0);
  const [page, setPage] = useState(0);
  const flat = StyleSheet.flatten(contentStyle) ?? {};
  const needed = page + BANNER_ROOM + (banner?.duringPlay ? PLAY_GAP : 0);
  const pinned = banner !== null && screen > 0 && page > 0 && needed <= screen;
  return (
    <View
      style={styles.fill}
      onLayout={(event) => setScreen(event.nativeEvent.layout.height)}
    >
      <ScrollView
        style={styles.fill}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentStyle}
      >
        {/* Measured without the banner so the choice can't flip-flop. */}
        <View
          style={{ gap: flat.gap }}
          onLayout={(event) =>
            setPage(
              event.nativeEvent.layout.height +
                Number(flat.paddingTop ?? flat.paddingVertical ?? 0) +
                Number(flat.paddingBottom ?? flat.paddingVertical ?? 0),
            )
          }
        >
          {children}
        </View>
        {banner && !pinned ? <BannerAd {...banner} /> : null}
      </ScrollView>
      {pinned ? (
        <View style={styles.footer}>
          <BannerAd {...banner} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  footer: { width: "100%", maxWidth: 760, alignSelf: "center" },
});
