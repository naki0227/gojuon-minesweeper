import { useSyncExternalStore } from "react";

import { japanDate } from "./schedule";

const noSubscription = () => () => {};

// Today's date in Japan, read on the device. Null during the static
// render, so answers are never baked into the HTML.
export function useJapanToday(): string | null {
  return useSyncExternalStore(
    noSubscription,
    () => japanDate(new Date()),
    () => null,
  );
}
