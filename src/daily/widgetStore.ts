// Only the iPhone has the widgets; widgetStore.ios.ts shares the day's
// game with them.
import type { WidgetShared } from "./widgetSync";

export function readWidgetShared(): WidgetShared {
  return { play: null, streak: null };
}

export function writeWidgetShared(_shared: WidgetShared): void {}
