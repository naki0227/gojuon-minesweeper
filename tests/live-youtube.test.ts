import { describe, expect, it } from "vitest";

import { chatComments, nextPollDelay } from "../scripts/live/youtube";

describe("YouTube live chat", () => {
  it("keeps plain text comments only", () => {
    const comments = chatComments({
      items: [
        {
          id: "1",
          snippet: { type: "textMessageEvent", displayMessage: "か" },
          authorDetails: { displayName: "たろう" },
        },
        {
          id: "2",
          snippet: { type: "superChatEvent", displayMessage: "¥500" },
          authorDetails: { displayName: "はなこ" },
        },
        { id: "3", snippet: { type: "textMessageEvent" } },
      ],
    });
    expect(comments).toEqual([{ id: "1", name: "たろう", text: "か" }]);
    expect(chatComments({})).toEqual([]);
  });

  it("never reads faster than the quota allows", () => {
    expect(nextPollDelay({ pollingIntervalMillis: 1000 })).toBe(5000);
    expect(nextPollDelay({ pollingIntervalMillis: 9000 })).toBe(9000);
    expect(nextPollDelay({})).toBe(5000);
  });
});
