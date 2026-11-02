import AsyncStorage from "@react-native-async-storage/async-storage";

// The best stars per 詰め五十音 puzzle id, kept on the device.
export type PuzzleRecords = Readonly<Record<string, number>>;

const KEY = "puzzles.v1";

export async function readPuzzleRecords(): Promise<PuzzleRecords> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PuzzleRecords) : {};
  } catch {
    return {};
  }
}

// Keeps the better of the saved and the new result.
export async function savePuzzleStars(
  id: string,
  stars: number,
): Promise<PuzzleRecords> {
  const records = await readPuzzleRecords();
  if ((records[id] ?? 0) >= stars) return records;
  const next = { ...records, [id]: stars };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Not saved this time; the result still shows.
  }
  return next;
}
