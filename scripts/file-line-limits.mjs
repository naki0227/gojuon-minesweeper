// Files may have at most DEFAULT_LIMIT lines. Files that were already larger
// when the check was introduced are listed with their size at that time: they
// may shrink but not grow. Lower or remove an entry after splitting the file.
export const DEFAULT_LIMIT = 300;

/** @type {Readonly<Record<string, number>>} */
export const LEGACY_LIMITS = {
  "app/index.tsx": 422,
  "app/online.tsx": 423,
  "src/components/HomeSetup.tsx": 758,
  "src/game/engine.ts": 334,
  "supabase/functions/online-game/index.ts": 507,
};

export const CHECKED_DIRECTORIES = [
  "app/",
  "src/",
  "scripts/",
  "tests/",
  "supabase/functions/",
];

const CHECKED_EXTENSIONS = /\.(ts|tsx|js|mjs)$/;

/** @param {string} path */
export function isCheckedFile(path) {
  return (
    CHECKED_EXTENSIONS.test(path) &&
    CHECKED_DIRECTORIES.some((directory) => path.startsWith(directory)) &&
    !path.startsWith("supabase/functions/_shared/app/")
  );
}

/** @param {string} text */
export function countLines(text) {
  if (text.length === 0) {
    return 0;
  }
  const lines = text.split("\n").length;
  return text.endsWith("\n") ? lines - 1 : lines;
}

// Returns files over their limit, and legacy entries whose file shrank or
// disappeared so the limit can be lowered.
/**
 * @param {readonly { path: string; lines: number }[]} files
 * @param {Readonly<Record<string, number>>} legacyLimits
 */
export function checkLineLimits(files, legacyLimits = LEGACY_LIMITS) {
  const sizes = new Map(files.map(({ path, lines }) => [path, lines]));

  const violations = files
    .map(({ path, lines }) => ({
      path,
      lines,
      limit: legacyLimits[path] ?? DEFAULT_LIMIT,
    }))
    .filter(({ lines, limit }) => lines > limit);

  const loosened = Object.entries(legacyLimits)
    .filter(([path, limit]) => (sizes.get(path) ?? -1) < limit)
    .map(([path, limit]) => ({ path, limit, lines: sizes.get(path) ?? null }));

  return { violations, loosened };
}
