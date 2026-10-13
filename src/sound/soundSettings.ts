import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

// Sound effects and background music, each switched on or off by the
// player and remembered on the device.
export type SoundSettings = { effects: boolean; music: boolean };

const KEY = "sound.v1";
let settings: SoundSettings = { effects: true, music: true };
const listeners = new Set<() => void>();

void AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<SoundSettings>;
    settings = {
      effects: saved.effects !== false,
      music: saved.music !== false,
    };
    listeners.forEach((listener) => listener());
  })
  .catch(() => {});

export function getSoundSettings(): SoundSettings {
  return settings;
}

export function setSoundSettings(next: Partial<SoundSettings>): void {
  settings = { ...settings, ...next };
  listeners.forEach((listener) => listener());
  void AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSoundSettings(): SoundSettings {
  return useSyncExternalStore(subscribe, getSoundSettings, getSoundSettings);
}
