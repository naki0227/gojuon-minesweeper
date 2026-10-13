import { describe, expect, it } from "vitest";

import { appStoreUrl } from "../src/links/site";
import {
  inviteUrl,
  joinCodeFromParam,
  randomInviteCode,
} from "../src/online/invite";
import { normalizeRoomCode } from "../src/online/protocol";

describe("invite links", () => {
  it("makes room codes the server accepts", () => {
    let seed = 0;
    const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 50; i += 1) {
      const code = randomInviteCode(random);
      expect(code).toMatch(/^[a-z2-9]{8}$/);
      expect(normalizeRoomCode(code)).toBe(code);
    }
  });

  it("round-trips a code through the link", () => {
    const url = new URL(inviteUrl("ab3k9xqz"));
    expect(url.origin).toBe("https://minesweeper.enludus.com");
    expect(url.pathname).toBe("/online");
    expect(joinCodeFromParam(url.searchParams.get("join") ?? undefined)).toBe(
      "ab3k9xqz",
    );
  });

  it("ignores a missing or invalid join parameter", () => {
    expect(joinCodeFromParam(undefined)).toBeNull();
    expect(joinCodeFromParam(["a", "b"])).toBeNull();
    expect(joinCodeFromParam("x")).toBeNull();
  });

  it("tags App Store links with the campaign", () => {
    const url = new URL(appStoreUrl("web_invite"));
    expect(url.pathname).toBe("/jp/app/id6819539119");
    expect(url.searchParams.get("ct")).toBe("web_invite");
  });
});
