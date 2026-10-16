import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SavedPlay } from "./play";
import { NO_STREAK, type Streak } from "./streak";

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

export async function readDailyMemory(): Promise<DailyMemory> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw
      ? { ...EMPTY, ...(JSON.parse(raw) as Partial<DailyMemory>) }
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

export async function writeDailyMemory(memory: DailyMemory): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(memory)).catch(() => {});
}
