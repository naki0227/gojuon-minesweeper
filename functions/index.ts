// Cloudflare Pages Function for "/" only: sends people whose browser
// prefers a language other than Japanese to the English build at /en/.
// A choice made with the language link (the "lang" cookie) wins. Without
// an Accept-Language header (most crawlers) the Japanese page is served.

type Context = { request: Request; next: () => Promise<Response> };

export function chosenLanguage(cookie: string | null): "ja" | "en" | null {
  const match = /(?:^|;\s*)lang=(ja|en)(?:;|$)/.exec(cookie ?? "");
  return match ? (match[1] as "ja" | "en") : null;
}

// The browser's most preferred language, as "ja" or "en".
export function browserLanguage(header: string | null): "ja" | "en" | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((item) => item.tag && item.tag !== "*" && item.q > 0)
    .sort((a, b) => b.q - a.q);
  const top = ranked[0]?.tag;
  if (!top) return null;
  return top === "ja" || top.startsWith("ja-") ? "ja" : "en";
}

export async function onRequest({ request, next }: Context): Promise<Response> {
  const language =
    chosenLanguage(request.headers.get("cookie")) ??
    browserLanguage(request.headers.get("accept-language"));
  if (language === "en") {
    const url = new URL(request.url);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/en/${url.search}`,
        Vary: "Accept-Language, Cookie",
      },
    });
  }
  const response = await next();
  const headers = new Headers(response.headers);
  headers.append("Vary", "Accept-Language, Cookie");
  return new Response(response.body, { status: response.status, headers });
}
