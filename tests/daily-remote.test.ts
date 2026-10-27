import { afterEach, describe, expect, it, vi } from "vitest";

import { QUESTIONS } from "../src/data/questions";
import { loadDaily } from "../src/daily/remote";

// 2026-10-27 7:41 Japan time: the day has turned but 10/27 is not online.
const NOW = new Date("2026-10-26T22:41:00Z");
const QUESTION_ID = QUESTIONS[0]!.id;

function json(date: string): Response {
  const body = { date, questionId: QUESTION_ID, opened: ["あ"] };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

// What the site really sends for a file that does not exist.
const appPage = () =>
  new Response("<!DOCTYPE html><html></html>", {
    headers: { "content-type": "text/html; charset=utf-8" },
  });

function serve(days: Record<string, () => Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const date = /daily\/([\d-]+)\/app\.json$/.exec(url)?.[1] ?? "";
      return (days[date] ?? appPage)();
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadDaily", () => {
  it("loads today's puzzle", async () => {
    serve({ "2026-10-27": () => json("2026-10-27") });
    const load = await loadDaily(NOW);
    expect(load.status).toBe("ok");
    expect(load.status === "ok" && load.daily.isToday).toBe(true);
  });

  it("shows yesterday's puzzle while today's is not online", async () => {
    serve({ "2026-10-26": () => json("2026-10-26") });
    const load = await loadDaily(NOW);
    expect(load).toMatchObject({
      status: "ok",
      daily: { date: "2026-10-26", isToday: false },
    });
  });

  it("is missing, not offline, when neither day is online", async () => {
    serve({});
    expect(await loadDaily(NOW)).toEqual({ status: "missing" });
  });

  it("is offline when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Network request failed");
      }),
    );
    expect(await loadDaily(NOW)).toEqual({ status: "offline" });
  });
});
