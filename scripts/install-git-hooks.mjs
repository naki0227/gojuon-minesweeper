// Runs on `npm install` / `npm ci`. Points git at the repository's hooks.
// Skipped quietly outside a git checkout (for example on the EAS builder).
import { execFileSync } from "node:child_process";

try {
  execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
    stdio: "ignore",
  });
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
    stdio: "ignore",
  });
} catch {
  // Not a git checkout, or git is unavailable: nothing to install.
}
