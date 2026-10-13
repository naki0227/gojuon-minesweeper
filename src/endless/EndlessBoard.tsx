import { CharacterBoard } from "../components/CharacterBoard";
import { adjacentMineCount, questionMineMultiplicity } from "../game/engine";
import type { EndlessState } from "./engine";

type Props = {
  game: EndlessState;
  mineChars: ReadonlySet<string>;
  hintedChars: ReadonlySet<string>;
  // Omit to show the board frozen (no cell can be opened).
  onOpen?: (char: string) => void;
};

// The endless question's board, shared by play and the pause cards.
export function EndlessBoard({ game, mineChars, hintedChars, onOpen }: Props) {
  return (
    <CharacterBoard
      language={game.question.language}
      openedChars={game.opened}
      hintedChars={hintedChars}
      mineChars={mineChars}
      mineCount={(char) => adjacentMineCount(game.question, char)}
      mineMultiplicity={(char) => questionMineMultiplicity(game.question, char)}
      canOpen={onOpen !== undefined && game.phase === "open"}
      onOpen={onOpen ?? (() => {})}
    />
  );
}
