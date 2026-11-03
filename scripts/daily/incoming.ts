/// <reference types="node" />
// Days of 今日の一問 planned outside Actions (with their 豆知識), sent in
// without the schedule key. The sender seals them with a public key
// (src/daily/incoming.pub.pem); only Actions, which holds
// DAILY_SCHEDULE_KEY, can derive the private key, open them and merge
// them into schedule.upcoming.enc. The repository is public, so nothing
// here may print an answer.
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  type KeyObject,
} from "node:crypto";

import { QUESTIONS } from "../../src/data/questions";
import { addDays, type DailyEntry } from "../../src/daily/schedule";

// PKCS#8 DER header of a raw 32-byte X25519 private key.
const X25519_PKCS8_PREFIX = Buffer.from(
  "302e020100300506032b656e04220420",
  "hex",
);

export function incomingPrivateKey(scheduleKey: Buffer): KeyObject {
  const raw = createHmac("sha256", scheduleKey)
    .update("daily-incoming-x25519")
    .digest();
  return createPrivateKey({
    key: Buffer.concat([X25519_PKCS8_PREFIX, raw]),
    format: "der",
    type: "pkcs8",
  });
}

export function incomingPublicKeyPem(scheduleKey: Buffer): string {
  return createPublicKey(incomingPrivateKey(scheduleKey))
    .export({ type: "spki", format: "pem" })
    .toString();
}

function sharedKey(secret: Buffer, ephemeral: Buffer): Buffer {
  return Buffer.from(
    hkdfSync("sha256", secret, ephemeral, "daily-incoming", 32),
  );
}

type Sealed = { v: 1; epk: string; iv: string; tag: string; data: string };

// ECIES: an ephemeral X25519 key, ECDH with the recipient, HKDF, AES-GCM.
export function sealIncoming(entries: DailyEntry[], publicPem: string): string {
  const { publicKey, privateKey } = generateKeyPairSync("x25519");
  const epk = publicKey.export({ type: "spki", format: "der" });
  const key = sharedKey(
    diffieHellman({ privateKey, publicKey: createPublicKey(publicPem) }),
    epk,
  );
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(entries), "utf8"),
    cipher.final(),
  ]);
  const sealed: Sealed = {
    v: 1,
    epk: epk.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  };
  return `${JSON.stringify(sealed)}\n`;
}

export function openIncoming(text: string, scheduleKey: Buffer): DailyEntry[] {
  const sealed = JSON.parse(text) as Sealed;
  const epk = Buffer.from(sealed.epk, "base64");
  const key = sharedKey(
    diffieHellman({
      privateKey: incomingPrivateKey(scheduleKey),
      publicKey: createPublicKey({ key: epk, format: "der", type: "spki" }),
    }),
    epk,
  );
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(sealed.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
  const body = Buffer.concat([
    decipher.update(Buffer.from(sealed.data, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(body.toString("utf8")) as DailyEntry[];
}

export type MergeResult = {
  upcoming: DailyEntry[];
  // Dates and reasons only: these go to the public log.
  log: string[];
};

// Puts the incoming days into the coming schedule. An incoming day
// replaces a planned one on the same date (it carries trivia), but never a
// day that is online already, never leaves a gap, and never reuses a
// question.
export function mergeIncoming(
  upcoming: readonly DailyEntry[],
  incoming: readonly DailyEntry[],
  options: { released: readonly DailyEntry[]; today: string; leaked: string[] },
): MergeResult {
  const byDate = new Map(upcoming.map((entry) => [entry.date, entry]));
  const releasedIds = options.released.map((entry) => entry.questionId);
  const releasedLast = options.released.at(-1)?.date ?? "";
  const log: string[] = [];
  const sorted = [...incoming].sort((a, b) => a.date.localeCompare(b.date));
  for (const entry of sorted) {
    const skip = (reason: string) =>
      log.push(`${entry.date}: skipped (${reason})`);
    const last = [...byDate.keys()].sort().at(-1) ?? releasedLast;
    if (entry.date <= options.today || entry.date <= releasedLast) {
      skip("already online");
      continue;
    }
    if (entry.date > addDays(last, 1)) {
      skip("would leave a gap");
      continue;
    }
    const question = QUESTIONS.find((item) => item.id === entry.questionId);
    if (!question || question.language !== "ja" || entry.opened.length === 0) {
      skip("unknown question");
      continue;
    }
    const usedElsewhere = new Set([
      ...releasedIds,
      ...options.leaked,
      ...[...byDate.values()]
        .filter((other) => other.date !== entry.date)
        .map((other) => other.questionId),
    ]);
    if (usedElsewhere.has(entry.questionId)) {
      skip("question already used");
      continue;
    }
    const trivia = entry.trivia?.trim();
    const triviaLength = trivia ? Array.from(trivia).length : 0;
    byDate.set(entry.date, {
      date: entry.date,
      questionId: entry.questionId,
      opened: [...entry.opened],
      ...(trivia && triviaLength >= 30 && triviaLength <= 100
        ? { trivia }
        : {}),
    });
    log.push(`${entry.date}: merged`);
  }
  return {
    upcoming: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    log,
  };
}
