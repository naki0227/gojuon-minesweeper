import { Platform, StyleSheet, Text, View } from "react-native";
import { Link, type Href } from "expo-router";

import type { QuestionFilters } from "../data/types";
import { colors } from "../theme/colors";
import { HOME_SETUP_TEXT as S } from "./HomeSetup.strings";
import { Pressable } from "./TapPressable";

// The ways to play, at the top of the home screen so they are seen first.
// Each starts at once with the question settings below it.
export function HomeModes({
  filters,
  disabled,
  onStart,
  onOnline,
}: {
  filters: QuestionFilters;
  // No question matches the settings.
  disabled: boolean;
  onStart: (filters: QuestionFilters) => void;
  onOnline?: (filters: QuestionFilters) => void;
}) {
  const params = { filters: JSON.stringify(filters) };
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{S.modesLabel}</Text>
      <View style={styles.grid}>
        <ModeTile
          primary
          title={S.local}
          note={S.localNote}
          disabled={disabled}
          onPress={() => onStart(filters)}
        />
        <ModeTile
          href={{ pathname: "/bot", params }}
          title={S.bot}
          note={S.botNote}
          disabled={disabled}
        />
        {onOnline ? (
          <ModeTile
            title={S.online}
            note={S.onlineNote}
            disabled={disabled}
            onPress={() => onOnline(filters)}
          />
        ) : null}
        {Platform.OS === "ios" ? (
          <ModeTile
            href={{ pathname: "/endless", params }}
            title={S.endless}
            note={S.endlessNote}
          />
        ) : null}
      </View>
      <Text style={styles.footnote}>{S.modesNote}</Text>
    </View>
  );
}

function ModeTile({
  title,
  note,
  primary = false,
  disabled = false,
  href,
  onPress,
}: {
  title: string;
  note: string;
  primary?: boolean;
  disabled?: boolean;
  href?: Href;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={[styles.title, primary && styles.titlePrimary]}>
        {title}
      </Text>
      <Text style={[styles.note, primary && styles.notePrimary]}>{note}</Text>
    </>
  );
  const look = [
    styles.tile,
    primary && styles.tilePrimary,
    disabled && styles.disabled,
  ];
  if (href) {
    // Link's Slot drops function and array styles on the web, so one
    // flattened style object.
    return (
      <Link href={href} asChild disabled={disabled}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          style={StyleSheet.flatten(look)}
        >
          {content}
        </Pressable>
      </Link>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [...look, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  heading: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 74,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  tilePrimary: { backgroundColor: colors.primary },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  titlePrimary: { color: colors.white },
  note: { color: "#536875", fontSize: 12, marginTop: 3 },
  notePrimary: { color: "#e3f3fa" },
  footnote: { color: "#536875", fontSize: 12 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
