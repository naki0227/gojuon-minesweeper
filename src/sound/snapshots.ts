import { useEffect, useRef } from "react";

import type { EndlessState } from "../endless/engine";
import { isMineCharacter, type GameState } from "../game/engine";
import type { OnlineRoom } from "../online/protocol";
import { playSound } from "./sounds";
import { transitionSound, type SoundSnapshot } from "./transitions";

export function localSnapshot(game: GameState | null): SoundSnapshot | null {
  if (!game) return null;
  return {
    key: game.question.id,
    opened: game.openedChars,
    isMine: (char) => isMineCharacter(game.question, char),
    won: game.winner !== null,
    finished: game.phase === "finished",
    message: game.lastMessage,
  };
}

// "won" is this player's win; the opponent's win ends the game too.
export function onlineSnapshot(
  room: OnlineRoom,
  seat: number | null,
): SoundSnapshot | null {
  const state = room.public_state;
  if (!state) return null;
  return {
    key: `${room.id}:${state.prompt}`,
    opened: state.openedChars,
    isMine: (char) => state.mineChars.includes(char),
    won: room.status === "finished" && state.winner === seat,
    finished: state.phase === "finished",
    message: state.lastMessage,
  };
}

// Game over is announced by the GAME OVER pause (Stinger) instead.
export function endlessSnapshot(
  game: EndlessState | null,
): SoundSnapshot | null {
  if (!game) return null;
  return {
    key: `${game.question.id}:${game.solved}`,
    opened: game.opened,
    isMine: (char) => isMineCharacter(game.question, char),
    won: game.phase === "cleared",
    finished: false,
    message: game.message,
  };
}

// Plays the sound for each change of a game held in state elsewhere.
export function useTransitionSounds(snapshot: SoundSnapshot | null): void {
  const previous = useRef(snapshot);
  useEffect(() => {
    playSound(transitionSound(previous.current, snapshot));
    previous.current = snapshot;
  });
}
