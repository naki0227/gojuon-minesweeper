// Moves the assets that `expo export -p web` takes from packages
// (dist/assets/node_modules/..., e.g. the MaterialIcons font of
// @expo/vector-icons) to dist/assets/vendor/... and rewrites the URLs in the
// bundle. `wrangler pages deploy` does not upload anything inside a
// node_modules folder, so on Cloudflare Pages those URLs fell through to the
// SPA page and the icons showed as broken glyphs.
// Usage: node scripts/move-vendor-assets.mjs [distDir]   (default: dist)
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { extname, join, resolve } from "node:path";

const FROM = "assets/node_modules";
const TO = "assets/vendor";
const TEXT_EXTENSIONS = new Set([".js", ".css", ".html", ".json", ".map"]);

const distDir = resolve(process.argv[2] ?? "dist");
const fromDir = join(distDir, FROM);
const toDir = join(distDir, TO);

if (!existsSync(fromDir)) {
  console.log(`move-vendor-assets: no ${FROM} in ${distDir}, nothing to do.`);
  process.exit(0);
}
if (existsSync(toDir)) {
  console.error(`move-vendor-assets: ${toDir} already exists.`);
  process.exit(1);
}

renameSync(fromDir, toDir);

function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* files(path);
    } else if (TEXT_EXTENSIONS.has(extname(entry.name))) {
      yield path;
    }
  }
}

// The URLs carry the base path in front ("/assets/..." or "/en/assets/..."),
// so only the part from "/assets/" on is replaced.
let rewritten = 0;
for (const path of files(distDir)) {
  const text = readFileSync(path, "utf8");
  const next = text.replaceAll(`/${FROM}/`, `/${TO}/`);
  if (next !== text) {
    writeFileSync(path, next);
    rewritten += 1;
  }
}

console.log(
  `move-vendor-assets: moved ${FROM} to ${TO}, rewrote ${rewritten} file(s).`,
);
