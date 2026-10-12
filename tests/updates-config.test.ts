import { describe, expect, it } from "vitest";

import appJson from "../app.json";
import easJson from "../eas.json";

const { expo } = appJson;

describe("EAS Update settings", () => {
  it("points the app at this project's update server", () => {
    expect(expo.updates.url).toBe(
      `https://u.expo.dev/${expo.extra.eas.projectId}`,
    );
  });

  // The fingerprint policy would hash config-plugin values such as the
  // AdMob app IDs, which differ between the EAS build worker and the
  // machine that publishes an update, so updates would never match.
  it("ties updates to the store version", () => {
    expect(expo.runtimeVersion).toEqual({ policy: "appVersion" });
  });

  it("builds production binaries on the production channel", () => {
    expect(easJson.build.production.channel).toBe("production");
    expect(easJson.build.preview.channel).toBe("preview");
  });
});
