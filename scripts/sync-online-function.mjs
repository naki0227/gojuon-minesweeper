// Copies the game rules the `online-game` Edge Function needs from src/
// into supabase/functions/_shared/app/, so the server judges moves with the
// same code as the app. Deno needs explicit file extensions and JSON import
// attributes, so relative imports are rewritten on the way.
//
// The output is generated (and git-ignored); run this before
// `supabase functions deploy online-game` (npm run online:deploy does both).

import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "supabase/functions/_shared/app");

// Directories under src/ the server uses, and which files to take.
const SOURCES = [
  { dir: "game", include: (name) => name.endsWith(".ts") },
  {
    dir: "data",
    include: (name) =>
      name === "types.ts" ||
      name === "questions.ts" ||
      /^question-bank-.*\.json$/.test(name),
  },
  {
    dir: "online",
    include: (name) => name === "protocol.ts" || name === "rules.ts",
  },
];

function rewriteImports(source) {
  return source.replace(
    /(from\s+)"(\.{1,2}\/[^"]+)"/g,
    (_match, prefix, specifier) =>
      specifier.endsWith(".json")
        ? `${prefix}"${specifier}" with { type: "json" }`
        : `${prefix}"${specifier}.ts"`,
  );
}

rmSync(outDir, { recursive: true, force: true });

for (const { dir, include } of SOURCES) {
  const from = join(root, "src", dir);
  const to = join(outDir, dir);
  mkdirSync(to, { recursive: true });

  for (const name of readdirSync(from).filter(include)) {
    if (name.endsWith(".json")) {
      cpSync(join(from, name), join(to, name));
      continue;
    }
    const header = `// Generated from src/${dir}/${name} by scripts/sync-online-function.mjs. Do not edit.\n`;
    writeFileSync(
      join(to, name),
      header + rewriteImports(readFileSync(join(from, name), "utf8")),
    );
  }
}

console.log(`Synced game rules into ${outDir}`);
