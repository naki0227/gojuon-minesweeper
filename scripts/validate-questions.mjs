import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const files = [
  path.join(root, "src/data/question-bank-ja.json"),
  path.join(root, "src/data/question-bank-en.json"),
];

const smallKana = new Map([
  ["ぁ", "あ"], ["ぃ", "い"], ["ぅ", "う"], ["ぇ", "え"], ["ぉ", "お"],
  ["っ", "つ"], ["ゃ", "や"], ["ゅ", "ゆ"], ["ょ", "よ"],
  ["ゎ", "わ"], ["ゕ", "か"], ["ゖ", "け"],
]);

const gojuon = new Set(
  "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんー",
);

function katakanaToHiragana(value) {
  return Array.from(value).map((char) => {
    const code = char.codePointAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) {
      return String.fromCodePoint(code - 0x60);
    }
    return char;
  }).join("");
}

function normalizeJa(value) {
  const hiragana = katakanaToHiragana(value.normalize("NFKC"));
  const plain = hiragana.normalize("NFD")
    .replace(/[\u3099\u309A]/g, "")
    .normalize("NFC");

  return Array.from(plain)
    .map((char) => smallKana.get(char) ?? char)
    .filter((char) => gojuon.has(char))
    .join("");
}

function normalizeEn(value) {
  return value.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

const entries = files.flatMap((file) =>
  JSON.parse(fs.readFileSync(file, "utf8")),
);

const ids = new Set();
const rawKeys = new Set();
const errors = [];
const categories = new Map();
const lengths = new Map();

for (const entry of entries) {
  if (!entry.id || !entry.category || !entry.display || !entry.value) {
    errors.push(`missing required field: ${JSON.stringify(entry)}`);
    continue;
  }

  if (entry.language !== "ja" && entry.language !== "en") {
    errors.push(`invalid language: ${entry.id}`);
    continue;
  }

  if (ids.has(entry.id)) {
    errors.push(`duplicate id: ${entry.id}`);
  }
  ids.add(entry.id);

  const rawKey = [entry.language, entry.category, entry.display, entry.value].join("::");
  if (rawKeys.has(rawKey)) {
    errors.push(`duplicate entry: ${rawKey}`);
  }
  rawKeys.add(rawKey);

  const normalized =
    entry.language === "ja" ? normalizeJa(entry.value) : normalizeEn(entry.value);

  if (!normalized) {
    errors.push(`normalizes to empty: ${entry.id} ${entry.display}`);
  }

  const categoryKey = `${entry.language}:${entry.category}`;
  categories.set(categoryKey, (categories.get(categoryKey) ?? 0) + 1);

  const lengthKey = `${entry.language}:${normalized.length}`;
  lengths.set(lengthKey, (lengths.get(lengthKey) ?? 0) + 1);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Question entries: ${entries.length}`);
console.log(`Categories: ${categories.size}`);
console.log("By category:");
for (const [key, count] of [...categories.entries()].sort()) {
  console.log(`  ${key}: ${count}`);
}
console.log("Validation OK");
