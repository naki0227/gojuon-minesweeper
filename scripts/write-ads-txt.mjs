// Writes the ads.txt files into dist/ after `expo export -p web`:
// - ads.txt     for AdSense (web), from EXPO_PUBLIC_ADSENSE_CLIENT_ID
// - app-ads.txt for AdMob app verification, from ADMOB_IOS_APP_ID /
//   ADMOB_ANDROID_APP_ID. Google crawls it at the root of the "Developer
//   Website" listed in App Store Connect / Google Play, so that site must
//   serve this build (or a copy of the file).
// Publisher IDs come from the environment, so no real ID is committed.
// A file whose ID is not set is skipped.
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const GOOGLE_CERTIFICATION_ID = "f08c47fec0942fa0";
const GOOGLE_SAMPLE_PUBLISHER = "pub-3940256099942544";
const distDir = join(process.cwd(), "dist");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function line(publisherId) {
  return `google.com, ${publisherId}, DIRECT, ${GOOGLE_CERTIFICATION_ID}`;
}

// ca-pub-123 (AdSense client ID) -> pub-123
function adSensePublisher() {
  const clientId = process.env.EXPO_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  if (!clientId) {
    return null;
  }

  const match = /^ca-(pub-\d+)$/.exec(clientId);
  if (!match) {
    fail(
      `ads.txt: EXPO_PUBLIC_ADSENSE_CLIENT_ID must look like ca-pub-1234567890123456 (got "${clientId}").`,
    );
  }
  return match[1];
}

// ca-app-pub-123~456 (AdMob app ID) -> pub-123
function adMobPublishers() {
  const publishers = new Set();

  for (const name of ["ADMOB_IOS_APP_ID", "ADMOB_ANDROID_APP_ID"]) {
    const appId = process.env[name]?.trim();
    if (!appId) {
      continue;
    }

    const match = /^ca-app-(pub-\d+)~\d+$/.exec(appId);
    if (!match) {
      fail(
        `app-ads.txt: ${name} must look like ca-app-pub-1234567890123456~1234567890 (got "${appId}").`,
      );
    }
    if (match[1] !== GOOGLE_SAMPLE_PUBLISHER) {
      publishers.add(match[1]);
    }
  }

  return [...publishers];
}

const adSense = adSensePublisher();
const adMob = adMobPublishers();

if (!adSense && adMob.length === 0) {
  console.log("ads.txt / app-ads.txt: no publisher IDs set; skipped.");
  process.exit(0);
}

if (!existsSync(distDir)) {
  fail("ads.txt: dist/ does not exist. Run expo export first.");
}

if (adSense) {
  writeFileSync(join(distDir, "ads.txt"), `${line(adSense)}\n`);
  console.log(`ads.txt: written for ${adSense}.`);
} else {
  console.log("ads.txt: EXPO_PUBLIC_ADSENSE_CLIENT_ID is not set; skipped.");
}

if (adMob.length > 0) {
  writeFileSync(
    join(distDir, "app-ads.txt"),
    `${adMob.map(line).join("\n")}\n`,
  );
  console.log(`app-ads.txt: written for ${adMob.join(", ")}.`);
} else {
  console.log("app-ads.txt: ADMOB_*_APP_ID is not set; skipped.");
}
