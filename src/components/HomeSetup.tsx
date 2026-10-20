import { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import Head from "expo-router/head";

import { BannerAd } from "../ads/BannerAd";
import {
  CATEGORY_GROUPS,
  findSelectedGroup,
  groupCategoriesIn,
} from "../data/categoryGroups";
import { LENGTH_PRESETS } from "../data/lengthPresets";
import {
  countQuestions,
  getAvailableLengths,
  getCategories,
} from "../data/questions";
import type {
  LengthFilter,
  QuestionFilters,
  QuestionLanguage,
} from "../data/types";
import { RemoveAdsOptions } from "./RemoveAdsOptions";
import { HOME_SETUP_TEXT as S } from "./HomeSetup.strings";
import { colors } from "../theme/colors";
import { HomeFooter } from "./HomeFooter";
import { HomeTitle } from "./HomeTitle";
import { Pressable } from "./TapPressable";

const MUTED = "#536875";
const LINE = "#cfdce4";
const MINE_FILL = "#fff0df";

const LANGUAGE_TABS: readonly {
  value: QuestionLanguage | "any";
  label: string;
}[] = [
  { value: "ja", label: S.languageJa },
  { value: "en", label: S.languageEn },
  { value: "any", label: S.languageAny },
];

function sameLength(left: LengthFilter, right: LengthFilter): boolean {
  if (typeof left === "object" && typeof right === "object") {
    return left.min === right.min && left.max === right.max;
  }
  return left === right;
}
function categorySummary(categories: readonly string[]): string {
  const shown = categories.slice(0, 4).join(S.summaryJoin);
  return categories.length > 4 ? S.summaryMore(shown) : shown;
}
function SampleTiles({ word }: { word: string }) {
  return (
    <View style={styles.sampleTiles}>
      {[...word].map((character, index) => (
        <View key={`${character}-${index}`} style={styles.sampleTile}>
          <Text style={styles.sampleTileText}>{character}</Text>
        </View>
      ))}
    </View>
  );
}

function GroupRow({
  label,
  summary,
  count,
  selected,
  sampleWord,
  onPress,
}: {
  label: string;
  summary: string;
  count: number;
  selected: boolean;
  sampleWord: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.groupRow,
        selected && styles.groupRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.groupText}>
        <Text style={[styles.groupLabel, selected && styles.groupLabelBold]}>
          {label}
        </Text>
        <Text style={styles.groupSummary} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      {selected && sampleWord ? <SampleTiles word={sampleWord} /> : null}
      <Text style={styles.groupCount}>{S.count(count)}</Text>
    </Pressable>
  );
}

function SquareChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function HomeSetup({
  filters,
  onChangeFilters,
  onStart,
  onOnline,
}: {
  filters: QuestionFilters;
  onChangeFilters: (
    update: (current: QuestionFilters) => QuestionFilters,
  ) => void;
  onStart: (filters: QuestionFilters) => void;
  onOnline?: (filters: QuestionFilters) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  const available = useMemo(
    () => getCategories(filters.language),
    [filters.language],
  );
  const groups = useMemo(
    () =>
      CATEGORY_GROUPS.map((group) => ({
        group,
        categories: groupCategoriesIn(group, available),
      })).filter(({ categories }) => categories.length > 0),
    [available],
  );
  const selectedGroup = findSelectedGroup(filters.categories, available);
  const customCategories =
    filters.categories.length > 0 && selectedGroup === null;
  const lengths = useMemo(
    () =>
      getAvailableLengths({
        language: filters.language,
        categories: filters.categories,
      }),
    [filters.categories, filters.language],
  );
  const candidateCount = useMemo(() => countQuestions(filters), [filters]);
  const exactLength =
    typeof filters.length === "number" ? filters.length : null;
  const sampleLanguage: QuestionLanguage =
    filters.language === "en" ? "en" : "ja";

  function setLanguage(language: QuestionLanguage | "any") {
    onChangeFilters(() => ({ language, categories: [], length: "any" }));
  }

  // Groups behave like radio buttons. An empty category list means every
  // genre, so tapping the selected group again must not clear it; "every
  // genre" has its own row instead.
  function selectCategories(categories: readonly string[]) {
    onChangeFilters((current) => ({ ...current, categories }));
  }

  function toggleCategory(category: string) {
    onChangeFilters((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((selected) => selected !== category)
        : [...current.categories, category],
    }));
  }

  function setLength(length: LengthFilter) {
    onChangeFilters((current) => ({ ...current, length }));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Head>
        <title>{S.pageTitle}</title>
        <meta name="description" content={S.pageDescription} />
      </Head>
      <ScrollView contentContainerStyle={styles.page}>
        <HomeTitle />
        <View style={styles.tabs}>
          {LANGUAGE_TABS.map((tab) => {
            const selected = filters.language === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setLanguage(tab.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextOn]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View>
          <GroupRow
            label={S.anyGroup}
            summary={S.anyGroupSummary}
            count={countQuestions({ ...filters, categories: [] })}
            selected={filters.categories.length === 0}
            sampleWord={null}
            onPress={() => selectCategories([])}
          />
          {groups.map(({ group, categories }) => (
            <GroupRow
              key={group.id}
              label={group.label}
              summary={categorySummary(categories)}
              count={countQuestions({ ...filters, categories })}
              selected={selectedGroup?.id === group.id}
              sampleWord={group.sample[sampleLanguage]}
              onPress={() => selectCategories(categories)}
            />
          ))}
          {customCategories ? (
            <Text style={styles.customNote}>
              {S.custom(categorySummary(filters.categories))}
            </Text>
          ) : null}
        </View>
        <View style={styles.lengthSection}>
          <Text style={styles.sectionLabel}>{S.lengthLabel}</Text>
          <View style={styles.segment}>
            {LENGTH_PRESETS.map((preset, index) => {
              const selected = sameLength(filters.length, preset.range);
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => setLength(preset.range)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.segmentItem,
                    index > 0 && styles.segmentDivider,
                    selected && styles.segmentSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      selected && styles.segmentLabelOn,
                    ]}
                  >
                    {preset.label}
                  </Text>
                  {preset.note ? (
                    <Text
                      style={[
                        styles.segmentNote,
                        selected && styles.segmentNoteOn,
                      ]}
                    >
                      {preset.note}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          {exactLength !== null ? (
            <Text style={styles.customNote}>
              {S.custom(S.chars(exactLength))}
            </Text>
          ) : null}
          <Pressable
            onPress={() => setDetailOpen(true)}
            accessibilityRole="button"
          >
            <Text style={styles.textLink}>{S.openDetail}</Text>
          </Pressable>
        </View>
        <View style={styles.startArea}>
          <Pressable
            disabled={candidateCount === 0}
            onPress={() => onStart(filters)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.startButton,
              candidateCount === 0 && styles.disabled,
              pressed && styles.startPressed,
            ]}
          >
            <Text style={styles.startText}>{S.start}</Text>
          </Pressable>
          <Text style={styles.countText}>{S.candidates(candidateCount)}</Text>
          <View style={styles.startMeta}>
            <Pressable
              onPress={() =>
                onStart({
                  language: filters.language,
                  categories: [],
                  length: "any",
                })
              }
              accessibilityRole="button"
            >
              <Text style={styles.textLink}>{S.quickPlay}</Text>
            </Pressable>
          </View>
          {Platform.OS === "ios" ? (
            <Link
              href={{
                pathname: "/endless",
                params: { filters: JSON.stringify(filters) },
              }}
              asChild
            >
              <Pressable accessibilityRole="button" style={styles.onlineButton}>
                <Text style={styles.onlineText}>{S.endless}</Text>
                <Text style={styles.onlineNote}>{S.endlessNote}</Text>
              </Pressable>
            </Link>
          ) : null}
          {onOnline ? (
            <Pressable
              disabled={candidateCount === 0}
              onPress={() => onOnline(filters)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.onlineButton,
                candidateCount === 0 && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.onlineText}>{S.online}</Text>
              <Text style={styles.onlineNote}>{S.onlineNote}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.adArea}>
          <BannerAd placement="setup" />
          <RemoveAdsOptions />
        </View>
        <HomeFooter />
      </ScrollView>
      <Modal
        visible={detailOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailOpen(false)}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{S.detailTitle}</Text>
            <Pressable
              onPress={() => setDetailOpen(false)}
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.closeText}>{S.close}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>{S.genres}</Text>
              <View style={styles.chipWrap}>
                <SquareChip
                  label={S.anyChip}
                  selected={filters.categories.length === 0}
                  onPress={() =>
                    onChangeFilters((current) => ({
                      ...current,
                      categories: [],
                    }))
                  }
                />
              </View>
              {groups.map(({ group, categories }) => (
                <View key={group.id} style={styles.detailGroup}>
                  <Text style={styles.detailGroupLabel}>{group.label}</Text>
                  <View style={styles.chipWrap}>
                    {categories.map((category) => (
                      <SquareChip
                        key={category}
                        label={category}
                        selected={filters.categories.includes(category)}
                        onPress={() => toggleCategory(category)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>{S.lengthDetail}</Text>
              <View style={styles.chipWrap}>
                <SquareChip
                  label={S.allLengths}
                  selected={filters.length === "any"}
                  onPress={() => setLength("any")}
                />
                {lengths.map((length) => (
                  <SquareChip
                    key={length}
                    label={S.chars(length)}
                    selected={filters.length === length}
                    onPress={() => setLength(length)}
                  />
                ))}
              </View>
              <Text style={styles.helperText}>{S.lengthHelp}</Text>
            </View>
            <Pressable
              onPress={() => setDetailOpen(false)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startPressed,
              ]}
            >
              <Text style={styles.startText}>{S.done(candidateCount)}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 18,
  },
  tabs: {
    flexDirection: "row",
    gap: 22,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  tab: {
    minHeight: 44,
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabSelected: {
    borderBottomColor: colors.ink,
  },
  tabText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: "500",
  },
  tabTextOn: {
    color: colors.ink,
    fontWeight: "900",
  },
  groupRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  groupRowSelected: {
    backgroundColor: colors.primarySoft,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 8,
  },
  groupText: {
    flex: 1,
    gap: 3,
  },
  groupLabel: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  groupLabelBold: {
    fontWeight: "900",
  },
  groupSummary: {
    color: MUTED,
    fontSize: 12,
  },
  groupCount: {
    minWidth: 52,
    color: MUTED,
    fontSize: 12,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  sampleTiles: {
    flexDirection: "row",
    gap: 2,
  },
  sampleTile: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MINE_FILL,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  sampleTileText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  customNote: {
    color: MUTED,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  lengthSection: {
    gap: 8,
  },
  sectionLabel: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
  },
  segment: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  segmentItem: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  segmentDivider: {
    borderLeftWidth: 1.5,
    borderLeftColor: colors.ink,
  },
  segmentSelected: {
    backgroundColor: colors.ink,
  },
  segmentLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  segmentLabelOn: {
    color: colors.background,
    fontWeight: "900",
  },
  segmentNote: {
    color: MUTED,
    fontSize: 10,
  },
  segmentNoteOn: {
    color: "#d7e7ef",
  },
  textLink: {
    color: colors.ink,
    fontSize: 13,
    textDecorationLine: "underline",
    paddingVertical: 6,
  },
  startArea: {
    gap: 8,
    marginTop: 6,
  },
  startButton: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.primary,
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginRight: 4,
  },
  startPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 2, height: 2 },
  },
  startText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  onlineButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    marginRight: 4,
    paddingVertical: 6,
  },
  onlineText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  onlineNote: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
  },
  startMeta: {
    alignItems: "center",
  },
  countText: {
    textAlign: "center",
    color: MUTED,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
  adArea: {
    gap: 10,
    marginTop: 8,
  },
  detailHeader: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  closeText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  detailSection: {
    gap: 10,
  },
  detailGroup: {
    gap: 6,
    marginTop: 4,
  },
  detailGroupLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#bdcbd5",
    backgroundColor: colors.white,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#1f617f",
  },
  helperText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
});
