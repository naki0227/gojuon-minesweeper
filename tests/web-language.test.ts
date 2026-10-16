import { describe, expect, it } from "vitest";

import { browserLanguage, chosenLanguage, onRequest } from "../functions/index";

describe("language for the web root", () => {
  it("reads the browser's top language", () => {
    expect(browserLanguage("ja,en-US;q=0.9")).toBe("ja");
    expect(browserLanguage("ja-JP")).toBe("ja");
    expect(browserLanguage("en-US,en;q=0.9,ja;q=0.8")).toBe("en");
    expect(browserLanguage("fr-FR,fr;q=0.9")).toBe("en");
    expect(browserLanguage("en;q=0.5,ja;q=0.9")).toBe("ja");
    expect(browserLanguage(null)).toBeNull();
    expect(browserLanguage("*")).toBeNull();
  });

  it("lets a chosen language win", () => {
    expect(chosenLanguage("a=1; lang=ja")).toBe("ja");
    expect(chosenLanguage("lang=en")).toBe("en");
    expect(chosenLanguage("slang=en")).toBeNull();
  });

  it("redirects only when English is wanted, keeping the query", async () => {
    const next = async () => new Response("ja page");
    const english = await onRequest({
      request: new Request("https://example.com/?ct=x", {
        headers: { "accept-language": "en-US" },
      }),
      next,
    });
    expect(english.status).toBe(302);
    expect(english.headers.get("location")).toBe("/en/?ct=x");

    const crawler = await onRequest({
      request: new Request("https://example.com/"),
      next,
    });
    expect(await crawler.text()).toBe("ja page");

    const chose = await onRequest({
      request: new Request("https://example.com/", {
        headers: { "accept-language": "en-US", cookie: "lang=ja" },
      }),
      next,
    });
    expect(chose.status).toBe(200);
  });
});
