export type AnalyticsEventName =
  | "game_start"
  | "answer_submit"
  | "answer_correct"
  | "answer_wrong"
  | "cell_open"
  | "mine_hit"
  | "game_finish"
  | "rematch";

export type AnalyticsParams = Readonly<Record<string, string | number | boolean>>;

/**
 * GA4 / Firebase Analytics 接続前の共通窓口。
 * Web と Native で送信先を分けても、ゲーム側のイベント名は変えない。
 */
export function trackEvent(
  _name: AnalyticsEventName,
  _params: AnalyticsParams = {},
): void {
  // Adapter will be wired when GA4/Firebase project IDs are available.
}
