import { sendEvent } from "./send";

export type AnalyticsEventName =
  | "game_start"
  | "answer_submit"
  | "answer_correct"
  | "answer_wrong"
  | "cell_open"
  | "mine_hit"
  | "game_finish"
  | "rematch"
  | "daily_finish";

export type AnalyticsParams = Readonly<
  Record<string, string | number | boolean>
>;

// The one entry point for analytics events (Firebase Analytics on iOS,
// nothing on the web). Event names stay the same whatever the backend.
export function trackEvent(
  name: AnalyticsEventName,
  params: AnalyticsParams = {},
): void {
  sendEvent(name, params);
}
