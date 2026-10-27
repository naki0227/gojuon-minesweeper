import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// src/daily/schedule.json names every coming day's 今日の一問. Anything the
// app imports ends up in the public web bundle, where the answers could be
// read ahead and sent to the プレゼント lottery, so only scripts and tests
// may import the schedule.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("daily schedule stays out of the app", () => {
  it("is not imported from app/ or src/", () => {
    const importers = [...sourceFiles("app"), ...sourceFiles("src")].filter(
      (path) =>
        path !== join("src", "daily", "schedule.ts") &&
        /from\s+["'][^"']*\/schedule(\.json)?["']/.test(
          readFileSync(path, "utf8"),
        ),
    );
    expect(importers).toEqual([]);
  });
});
