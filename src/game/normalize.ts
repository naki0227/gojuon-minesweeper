import { GOJUON_SET } from "./gojuon";

const SMALL_KANA_MAP: Readonly<Record<string, string>> = {
  "ぁ": "あ",
  "ぃ": "い",
  "ぅ": "う",
  "ぇ": "え",
  "ぉ": "お",
  "っ": "つ",
  "ゃ": "や",
  "ゅ": "ゆ",
  "ょ": "よ",
  "ゎ": "わ",
  "ゕ": "か",
  "ゖ": "け",
};

function katakanaToHiragana(value: string): string {
  return Array.from(value)
    .map((char) => {
      const code = char.codePointAt(0);
      if (code === undefined) {
        return char;
      }

      if (code >= 0x30a1 && code <= 0x30f6) {
        return String.fromCodePoint(code - 0x60);
      }

      return char;
    })
    .join("");
}

export function normalizeKana(value: string): string {
  const hiragana = katakanaToHiragana(value.normalize("NFKC"));

  const withoutVoicing = hiragana
    .normalize("NFD")
    .replace(/[\u3099\u309A]/g, "")
    .normalize("NFC");

  return Array.from(withoutVoicing)
    .map((char) => SMALL_KANA_MAP[char] ?? char)
    .filter((char) => GOJUON_SET.has(char))
    .join("");
}

export function normalizedLength(value: string): number {
  return Array.from(normalizeKana(value)).length;
}
