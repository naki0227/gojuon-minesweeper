import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  decryptSchedule,
  encryptSchedule,
  type DailyEntry,
} from "../src/daily/schedule";

const KEY = randomBytes(32);
const COMING: DailyEntry[] = [
  { date: "2099-01-01", questionId: "jam-00001", opened: ["あ"] },
];

// Loads src/daily/schedule.ts afresh, run from a folder that holds the
// given encrypted file (or none), with DAILY_SCHEDULE_KEY set or not.
async function loadSchedule(encrypted: string | null, key?: Buffer) {
  const root = mkdtempSync(join(tmpdir(), "daily-"));
  mkdirSync(join(root, "src/daily"), { recursive: true });
  if (encrypted !== null) {
    writeFileSync(join(root, "src/daily/schedule.upcoming.enc"), encrypted);
  }
  vi.spyOn(process, "cwd").mockReturnValue(root);
  vi.stubEnv("DAILY_SCHEDULE_KEY", key ? key.toString("base64") : "");
  vi.resetModules();
  const schedule = await import("../src/daily/schedule");
  rmSync(root, { recursive: true });
  return schedule;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("encrypted schedule", () => {
  it("decrypts what it encrypts, and the file does not show the answer", () => {
    const text = encryptSchedule(COMING, KEY);
    expect(text).not.toContain("jam-00001");
    expect(decryptSchedule(text, KEY)).toEqual(COMING);
  });

  it("rejects another key and a changed file", () => {
    const text = encryptSchedule(COMING, KEY);
    expect(() => decryptSchedule(text, randomBytes(32))).toThrow();
    const data = Buffer.from(text, "base64");
    data[data.length - 1] = data[data.length - 1]! ^ 1;
    expect(() => decryptSchedule(data.toString("base64"), KEY)).toThrow();
  });

  it("adds the coming days when the key is set", async () => {
    const schedule = await loadSchedule(encryptSchedule(COMING, KEY), KEY);
    expect(schedule.DAILY_SCHEDULE.at(-1)).toEqual(COMING[0]);
    expect(schedule.requireFullSchedule()).toBe(schedule.DAILY_SCHEDULE);
  });

  it("loads only released days without the key, and planning stops", async () => {
    const schedule = await loadSchedule(encryptSchedule(COMING, KEY));
    expect(schedule.DAILY_SCHEDULE.some((e) => e.date === "2099-01-01")).toBe(
      false,
    );
    expect(() => schedule.requireFullSchedule()).toThrow(/DAILY_SCHEDULE_KEY/);
    expect(() => schedule.planSeed("2099-01-01")).toThrow(/DAILY_SCHEDULE_KEY/);
  });

  it("seeds the planning from the key, not from the date alone", async () => {
    const a = await loadSchedule(null, KEY);
    const seedA = a.planSeed("2099-01-01");
    const b = await loadSchedule(null, randomBytes(32));
    expect(seedA).not.toBe(b.planSeed("2099-01-01"));
    expect(seedA).not.toContain("2099-01-01");
  });
});
