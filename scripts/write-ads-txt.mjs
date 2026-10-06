// Writes dist/ads.txt after `expo export -p web` when an AdSense client ID is
// configured. The publisher ID comes from the environment, so no real ID is
// committed. Without it, nothing is written.
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const clientId = process.env.EXPO_PUBLIC_ADSENSE_CLIENT_ID?.trim();
const distDir = join(process.cwd(), "dist");

if (!clientId) {
  console.log("ads.txt: EXPO_PUBLIC_ADSENSE_CLIENT_ID is not set; skipped.");
  process.exit(0);
}

const match = /^ca-(pub-\d+)$/.exec(clientId);
if (!match) {
  console.error(
    `ads.txt: EXPO_PUBLIC_ADSENSE_CLIENT_ID must look like ca-pub-1234567890123456 (got "${clientId}").`,
  );
  process.exit(1);
}

if (!existsSync(distDir)) {
  console.error("ads.txt: dist/ does not exist. Run expo export first.");
  process.exit(1);
}

writeFileSync(
  join(distDir, "ads.txt"),
  `google.com, ${match[1]}, DIRECT, f08c47fec0942fa0\n`,
);
console.log(`ads.txt: written for ${match[1]}.`);
