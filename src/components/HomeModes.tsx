import { Platform, StyleSheet, Text } from "react-native";
import { Link, type Href } from "expo-router";

import type { QuestionFilters } from "../data/types";
import { colors } from "../theme/colors";
import { HOME_SETUP_TEXT as S } from "./HomeSetup.strings";
import { Pressable } from "./TapPressable";

// The other ways to play, under the home screen's start button. Each takes
// the filters chosen above it.
export function HomeModes({
  filters,
  disabled,
  onOnline,
}: {
  filters: QuestionFilters;
  // No question matches the filters.
  disabled: boolean;
  onOnline?: (filters: QuestionFilters) => void;
}) {
  const params = { filters: JSON.stringify(filters) };
  return (
    <>
      <ModeLink
        href={{ pathname: "/bot", params }}
        title={S.bot}
        note={S.botNote}
        disabled={disabled}
      />
      {Platform.OS === "ios" ? (
        <ModeLink
          href={{ pathname: "/endless", params }}
          title={S.endless}
          note={S.endlessNote}
        />
      ) : null}
      {onOnline ? (
        <Pressable
          disabled={disabled}
          onPress={() => onOnline(filters)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            disabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.title}>{S.online}</Text>
          <Text style={styles.note}>{S.onlineNote}</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function ModeLink({
  href,
  title,
  note,
  disabled = false,
}: {
  href: Href;
  title: string;
  note: string;
  disabled?: boolean;
}) {
  return (
    <Link href={href} asChild disabled={disabled}>
      {/* Link's Slot drops function styles on the web, so a plain array. */}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={[styles.button, disabled && styles.disabled]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note}>{note}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    marginRight: 4,
    paddingVertical: 6,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  note: {
    color: "#536875",
    fontSize: 11,
    marginTop: 2,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
