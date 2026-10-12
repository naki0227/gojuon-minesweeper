import { describe, expect, it } from "vitest";

import {
  checkLineLimits,
  countLines,
  DEFAULT_LIMIT,
  isCheckedFile,
} from "../scripts/file-line-limits.mjs";

describe("countLines", () => {
  it("counts lines with and without a trailing newline", () => {
    expect(countLines("")).toBe(0);
    expect(countLines("a")).toBe(1);
    expect(countLines("a\nb\n")).toBe(2);
    expect(countLines("a\nb")).toBe(2);
  });
});

describe("isCheckedFile", () => {
  it("checks source files and skips data and generated code", () => {
    expect(isCheckedFile("src/game/engine.ts")).toBe(true);
    expect(isCheckedFile("app/index.tsx")).toBe(true);
    expect(isCheckedFile("scripts/validate-questions.mjs")).toBe(true);
    expect(isCheckedFile("src/data/question-bank-ja.json")).toBe(false);
    expect(isCheckedFile("docs/TODO.md")).toBe(false);
    expect(isCheckedFile("supabase/functions/_shared/app/game/engine.ts")).toBe(
      false,
    );
  });
});

describe("checkLineLimits", () => {
  const legacy = { "app/big.tsx": 400 };

  it("accepts files at the limit", () => {
    const result = checkLineLimits(
      [
        { path: "src/a.ts", lines: DEFAULT_LIMIT },
        { path: "app/big.tsx", lines: 400 },
      ],
      legacy,
    );
    expect(result).toEqual({ violations: [], loosened: [] });
  });

  it("rejects new files over the default limit", () => {
    const { violations } = checkLineLimits(
      [{ path: "src/a.ts", lines: DEFAULT_LIMIT + 1 }],
      legacy,
    );
    expect(violations).toEqual([
      { path: "src/a.ts", lines: DEFAULT_LIMIT + 1, limit: DEFAULT_LIMIT },
    ]);
  });

  it("rejects legacy files that grow", () => {
    const { violations } = checkLineLimits(
      [{ path: "app/big.tsx", lines: 401 }],
      legacy,
    );
    expect(violations).toEqual([
      { path: "app/big.tsx", lines: 401, limit: 400 },
    ]);
  });

  it("reports legacy entries that can be lowered or removed", () => {
    expect(
      checkLineLimits([{ path: "app/big.tsx", lines: 350 }], legacy).loosened,
    ).toEqual([{ path: "app/big.tsx", lines: 350, limit: 400 }]);
    expect(checkLineLimits([], legacy).loosened).toEqual([
      { path: "app/big.tsx", lines: null, limit: 400 },
    ]);
  });
});
