import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import { MUSIC_SOURCE, MUSIC_VOLUME, prepareAudio } from "./sounds";
import { useSoundSettings } from "./soundSettings";

// Loops the background music while it is switched on and the app is in
// the foreground. Browsers only allow audio after the first tap, so on the
// web it starts then.
export function BackgroundMusic() {
  const { music } = useSoundSettings();
  const player = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    if (!music) {
      player.current?.pause();
      return;
    }
    const play = () => {
      try {
        prepareAudio();
        player.current ??= createAudioPlayer(MUSIC_SOURCE);
        player.current.loop = true;
        player.current.volume = MUSIC_VOLUME;
        player.current.play();
      } catch {
        // No music rather than an error.
      }
    };
    const pause = () => player.current?.pause();
    const appState = AppState.addEventListener("change", (state) =>
      state === "active" ? play() : pause(),
    );
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const start = () => play();
      document.addEventListener("pointerdown", start, { once: true });
      return () => {
        document.removeEventListener("pointerdown", start);
        appState.remove();
        pause();
      };
    }
    play();
    return () => {
      appState.remove();
      pause();
    };
  }, [music]);

  return null;
}
