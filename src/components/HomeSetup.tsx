import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { BannerAd } from "../ads/BannerAd";
import {
  CATEGORY_GROUPS,
  findSelectedGroup,
  groupCategoriesIn,
  LENGTH_PRESETS,
} from "../data/categoryGroups";
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

// Colors for the home screen, taken from the game screen (app/index.tsx)
// so both screens read as one app.
const INK = "#102433";
const PAPER = "#f7fafc";
const ACCENT = "#3388b0";
const MUTED = "#536875";
const LINE = "#cfdce4";
const MINE_FILL = "#fff0df";
const MINE_BORDER = "#e98a2f";

const LANGUAGE_TABS: readonly {
  value: QuestionLanguage | "any";
  label: string;
}[] = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
  { value: "any", label: "まぜる" },
];

function sameLength(left: LengthFilter, right: LengthFilter): boolean {
  if (typeof left === "object" && typeof right === "object") {
    return left.min === right.min && left.max === right.max;
  }
  return left === right;
}

function categorySummary(categories: readonly string[]): string {
  const shown = categories.slice(0, 4).join("、");
  return categories.length > 4 ? `${shown} など` : shown;
}

function SampleTiles({ word }: { word: string }) {
  // Every character of an answer is a mine, as on the real board.
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
      <Text style={styles.groupCount}>{count}問</Text>
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
}: {
  filters: QuestionFilters;
  onChangeFilters: (
    update: (current: QuestionFilters) => QuestionFilters,
  ) => void;
  onStart: (filters: QuestionFilters) => void;
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
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.titleRow} accessibilityRole="header">
          <View style={styles.titleTiles}>
            <Text style={styles.titleTile}>五</Text>
            <Text style={styles.titleTile}>十</Text>
            <Text style={[styles.titleTile, styles.titleTileAccent]}>音</Text>
          </View>
          <Text style={styles.titleText}>マインスイーパー</Text>
        </View>

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
            label="ぜんぶのジャンル"
            summary="すべてのジャンルから出題"
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
              細かく選択中：{categorySummary(filters.categories)}
            </Text>
          ) : null}
        </View>

        <View style={styles.lengthSection}>
          <Text style={styles.sectionLabel}>ことばの長さ</Text>
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
            <Text style={styles.customNote}>細かく選択中：{exactLength}字</Text>
          ) : null}
          <Pressable
            onPress={() => setDetailOpen(true)}
            accessibilityRole="button"
          >
            <Text style={styles.textLink}>ジャンルと文字数を細かく選ぶ</Text>
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
            <Text style={styles.startText}>対戦をはじめる</Text>
          </Pressable>
          <Text style={styles.countText}>
            現在の条件：候補 {candidateCount} 問
          </Text>
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
              <Text style={styles.textLink}>おまかせで遊ぶ</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.adArea}>
          <BannerAd placement="setup" />
          <RemoveAdsOptions />
        </View>

        <View style={styles.footerLinks}>
          <Link href="/privacy" style={styles.footerLink}>
            プライバシーポリシー
          </Link>
          <Text style={styles.footerSeparator}>/</Text>
          <Link href="/support" style={styles.footerLink}>
            サポート
          </Link>
        </View>
      </ScrollView>

      <Modal
        visible={detailOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailOpen(false)}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>ジャンルと文字数</Text>
            <Pressable
              onPress={() => setDetailOpen(false)}
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.closeText}>閉じる</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>ジャンル（複数選べます）</Text>
              <View style={styles.chipWrap}>
                <SquareChip
                  label="ぜんぶ"
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
              <Text style={styles.sectionLabel}>文字数</Text>
              <View style={styles.chipWrap}>
                <SquareChip
                  label="ぜんぶ"
                  selected={filters.length === "any"}
                  onPress={() => setLength("any")}
                />
                {lengths.map((length) => (
                  <SquareChip
                    key={length}
                    label={`${length}字`}
                    selected={filters.length === length}
                    onPress={() => setLength(length)}
                  />
                ))}
              </View>
              <Text style={styles.helperText}>
                日本語は小文字・濁音・半濁音を同じ文字として扱い、長音「ー」は1文字。英語はスペースや記号を数えません。
              </Text>
            </View>

            <Pressable
              onPress={() => setDetailOpen(false)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startPressed,
              ]}
            >
              <Text style={styles.startText}>
                決定（候補 {candidateCount} 問）
              </Text>
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
    backgroundColor: PAPER,
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
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  titleTiles: {
    flexDirection: "row",
    gap: 3,
  },
  titleTile: {
    width: 30,
    height: 30,
    backgroundColor: INK,
    color: PAPER,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 30,
    textAlign: "center",
    overflow: "hidden",
  },
  titleTileAccent: {
    backgroundColor: ACCENT,
    color: "#ffffff",
  },
  titleText: {
    color: INK,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.8,
    paddingBottom: 1,
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
    borderBottomColor: INK,
  },
  tabText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: "500",
  },
  tabTextOn: {
    color: INK,
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
    backgroundColor: "#eaf6fb",
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
    paddingLeft: 8,
  },
  groupText: {
    flex: 1,
    gap: 3,
  },
  groupLabel: {
    color: INK,
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
    width: 52,
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
    borderColor: MINE_BORDER,
  },
  sampleTileText: {
    color: INK,
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
    borderColor: INK,
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
    borderLeftColor: INK,
  },
  segmentSelected: {
    backgroundColor: INK,
  },
  segmentLabel: {
    color: INK,
    fontSize: 14,
    fontWeight: "700",
  },
  segmentLabelOn: {
    color: PAPER,
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
    color: INK,
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
    borderColor: INK,
    backgroundColor: ACCENT,
    shadowColor: INK,
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
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
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
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerLink: {
    color: INK,
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 6,
  },
  footerSeparator: {
    color: MUTED,
    fontSize: 12,
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
    color: INK,
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  detailTitle: {
    color: INK,
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
    color: INK,
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
    backgroundColor: "#ffffff",
  },
  chipSelected: {
    borderColor: ACCENT,
    backgroundColor: "#eaf6fb",
  },
  chipText: {
    color: INK,
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
