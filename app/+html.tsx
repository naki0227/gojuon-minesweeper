import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

import { LOCALE } from "../src/i18n";
import { APP_STORE_ID } from "../src/links/site";

// Safari's Smart App Banner: "開く" when the app is installed, "入手"
// otherwise. app-argument hands the current URL (an invite link, say) to
// the app, so it is written with the page's own URL as it loads.
const SMART_BANNER = `document.write('<meta name="apple-itunes-app" content="app-id=${APP_STORE_ID}, app-argument=' + location.href.replace(/[^\\w\\-.~:/?#&=%+]/g, "") + '">')`;

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang={LOCALE}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Root paths, so the /en/ pages use the same icons. */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: SMART_BANNER }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
