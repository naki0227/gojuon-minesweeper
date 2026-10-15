import type { AnalyticsParams } from "./events";

// The web build sends nothing (yet). send.native.ts uses Firebase.
export function sendEvent(_name: string, _params: AnalyticsParams): void {}
