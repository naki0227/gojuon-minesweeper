import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import {
  checkLineLimits,
  countLines,
  DEFAULT_LIMIT,
  isCheckedFile,
} from "./file-line-limits.mjs";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(isCheckedFile);

const files = tracked.map((path) => ({
  path,
  lines: countLines(readFileSync(path, "utf8")),
}));

const { violations, loosened } = checkLineLimits(files);

for (const { path, lines, limit } of loosened) {
  const now = lines === null ? "removed" : `${lines} lines`;
  console.warn(
    `note: ${path} is now ${now}; lower its entry (${limit}) in scripts/file-line-limits.mjs.`,
  );
}

if (violations.length > 0) {
  for (const { path, lines, limit } of violations) {
    console.error(`${path}: ${lines} lines (limit ${limit})`);
  }
  console.error(
    `\nSplit the file by responsibility. New files are limited to ${DEFAULT_LIMIT} lines; listed legacy files may not grow.`,
  );
  process.exit(1);
}

console.log(`File line limits OK (${files.length} files).`);
