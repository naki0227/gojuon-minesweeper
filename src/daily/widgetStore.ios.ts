// The day's game and the streak in the App Group the widgets read
// (targets/widget/Shared.swift uses the same group and keys). On a build
// without the widgets (1.0.2 and older), ExtensionStorage does nothing.
import { ExtensionStorage } from "@bacons/apple-targets";

import type { SavedPlay } from "./play";
import type { Streak } from "./streak";
import type { WidgetShared } from "./widgetSync";

const storage = new ExtensionStorage("group.com.naki0227.gojuonminesweeper");

function read<T>(key: string): T | null {
  try {
    const raw = storage.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function readWidgetShared(): WidgetShared {
  return {
    play: read<SavedPlay>("daily.play"),
    streak: read<Streak>("daily.streak"),
  };
}

export function writeWidgetShared({ play, streak }: WidgetShared): void {
  try {
    storage.set("daily.play", play ? JSON.stringify(play) : undefined);
    storage.set("daily.streak", streak ? JSON.stringify(streak) : undefined);
    ExtensionStorage.reloadWidget();
  } catch {
    // The widgets just keep what they had.
  }
}
