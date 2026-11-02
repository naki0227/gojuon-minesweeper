import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";

import { PUZZLE_PACK } from "./pack";
import type { SoloPlay } from "../game/solo";
import { puzzleStars, startPuzzle } from "./play";
import { PuzzleList } from "./PuzzleList";
import { PuzzleView } from "./PuzzleView";
import {
  readPuzzleRecords,
  savePuzzleStars,
  type PuzzleRecords,
} from "./storage";

// 詰め五十音: the list of puzzles, or the one being solved.
export function PuzzlesScreen() {
  const [records, setRecords] = useState<PuzzleRecords>({});
  const [index, setIndex] = useState<number | null>(null);
  const [play, setPlay] = useState<SoloPlay | null>(null);

  useEffect(() => {
    void readPuzzleRecords().then(setRecords);
  }, []);

  const open = useCallback((next: number) => {
    setIndex(next);
    setPlay(startPuzzle(PUZZLE_PACK[next]!));
  }, []);

  function change(next: SoloPlay) {
    setPlay(next);
    if (index === null) return;
    const entry = PUZZLE_PACK[index]!;
    const got = puzzleStars(next, entry.par);
    if (got > 0) void savePuzzleStars(entry.id, got).then(setRecords);
  }

  if (index === null || !play) {
    return (
      <PuzzleList
        pack={PUZZLE_PACK}
        records={records}
        onPick={open}
        onBack={() => router.back()}
      />
    );
  }
  return (
    <PuzzleView
      key={PUZZLE_PACK[index]!.id}
      entry={PUZZLE_PACK[index]!}
      play={play}
      index={index}
      onChange={change}
      onNext={
        index + 1 < PUZZLE_PACK.length ? () => open(index + 1) : undefined
      }
      onList={() => setIndex(null)}
    />
  );
}
