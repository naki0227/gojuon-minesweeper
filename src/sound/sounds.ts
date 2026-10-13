import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

import bgm from "../../assets/sounds/bgm.mp3";
import chain from "../../assets/sounds/chain.mp3";
import correct from "../../assets/sounds/correct.mp3";
import mine from "../../assets/sounds/mine.mp3";
import open from "../../assets/sounds/open.mp3";
import over from "../../assets/sounds/over.mp3";
import start from "../../assets/sounds/start.mp3";
import tap from "../../assets/sounds/tap.mp3";
import wrong from "../../assets/sounds/wrong.mp3";
import { getSoundSettings } from "./soundSettings";
import type { SoundName } from "./transitions";

const EFFECTS: Record<SoundName, { source: number; volume: number }> = {
  open: { source: open, volume: 0.6 },
  chain: { source: chain, volume: 0.6 },
  mine: { source: mine, volume: 0.8 },
  wrong: { source: wrong, volume: 0.5 },
  correct: { source: correct, volume: 0.8 },
  start: { source: start, volume: 0.6 },
  over: { source: over, volume: 0.7 },
  tap: { source: tap, volume: 0.4 },
};

export const MUSIC_SOURCE = bgm;
export const MUSIC_VOLUME = 0.3;

// Game sounds mix with other audio and follow the silent switch, like
// most casual games.
let modeSet = false;
export function prepareAudio(): void {
  if (modeSet) return;
  modeSet = true;
  void setAudioModeAsync({
    playsInSilentMode: false,
    interruptionMode: "mixWithOthers",
  }).catch(() => {});
}

const players: Partial<Record<SoundName, AudioPlayer>> = {};

export function playSound(name: SoundName | null): void {
  if (!name || !getSoundSettings().effects) return;
  try {
    prepareAudio();
    const effect = EFFECTS[name];
    const player = (players[name] ??= createAudioPlayer(effect.source));
    player.volume = effect.volume;
    void player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // A missing sound is never worth an error.
  }
}
