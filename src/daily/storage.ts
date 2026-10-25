import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SavedPlay } from "./play";
import { NO_STREAK, type Streak } from "./streak";
import { readWidgetShared, writeWidgetShared } from "./widgetStore";
import { mergePlay, mergeStreak } from "./widgetSync";

// What the device remembers about 今日の一問: the day's game in progress,
// the streak, the morning reminder and the gift tickets.
export type DailyMemory = {
  play: SavedPlay | null;
  streak: Streak;
  reminder: boolean;
  tickets: { ticket: string; date: string }[];
  device: string | null;
};

const KEY = "daily.v1";
const EMPTY: DailyMemory = {
  play: null,
  streak: NO_STREAK,
  reminder: false,
  tickets: [],
  device: null,
};

async function readSaved(): Promise<DailyMemory> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw
      ? { ...EMPTY, ...(JSON.parse(raw) as Partial<DailyMemory>) }
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

// Takes in what was played in the widgets since, and hands the result
// back to them.
export async function readDailyMemory(): Promise<DailyMemory> {
  const saved = await readSaved();
  const widget = readWidgetShared();
  const memory: DailyMemory = {
    ...saved,
    play: mergePlay(saved.play, widget.play),
    streak: widget.streak
      ? mergeStreak(saved.streak, widget.streak)
      : saved.streak,
  };
  writeWidgetShared({ play: memory.play, streak: memory.streak });
  return memory;
}

export async function writeDailyMemory(memory: DailyMemory): Promise<void> {
  writeWidgetShared({ play: memory.play, streak: memory.streak });
  await AsyncStorage.setItem(KEY, JSON.stringify(memory)).catch(() => {});
}
