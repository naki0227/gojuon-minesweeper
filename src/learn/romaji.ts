// Hepburn romaji for learners: the board's captions, and the spellings
// accepted as answers.

const BASE: Readonly<Record<string, string>> = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "wo",
  ん: "n",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  ぁ: "a",
  ぃ: "i",
  ぅ: "u",
  ぇ: "e",
  ぉ: "o",
};

// き + ゃ → kya, し + ゃ → sha, ち + ゃ → cha, じ + ゃ → ja.
const SMALL_Y: Readonly<Record<string, string>> = { ゃ: "a", ゅ: "u", ょ: "o" };

// The caption under a board cell (the board has no voiced kana).
export function cellRomaji(char: string): string {
  return char === "ー" ? "-" : (BASE[char] ?? "");
}

function hiragana(value: string): string {
  return Array.from(value.normalize("NFKC"))
    .map((char) => {
      const code = char.codePointAt(0)!;
      return code >= 0x30a1 && code <= 0x30f6
        ? String.fromCodePoint(code - 0x60)
        : char;
    })
    .join("");
}

// "らーめん" → "raamen", "がっこう" → "gakkou", "きょう" → "kyou".
export function toRomaji(reading: string): string {
  const chars = Array.from(hiragana(reading));
  let out = "";
  let doubleNext = false;
  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i]!;
    if (char === "っ") {
      doubleNext = true;
      continue;
    }
    if (char === "ー") {
      out += out.at(-1) ?? "";
      continue;
    }
    let syllable = BASE[char] ?? "";
    const small = SMALL_Y[chars[i + 1] ?? ""];
    if (small && syllable.endsWith("i") && syllable.length > 1) {
      const stem = syllable.slice(0, -1);
      syllable = /(sh|ch|j)$/.test(stem) ? stem + small : `${stem}y${small}`;
      i += 1;
    }
    if (doubleNext && syllable) {
      syllable = (syllable.startsWith("ch") ? "t" : syllable[0]) + syllable;
      doubleNext = false;
    }
    out += syllable;
  }
  return out;
}

// What a learner might type for a reading: written out ("gakkou",
// "raamen") and with long vowels shortened ("gakko", "ramen").
export function romajiSpellings(reading: string): string[] {
  const full = toRomaji(reading);
  const short = full.replace(/([aeiou])\1/g, "$1").replace(/ou/g, "o");
  return [...new Set([full, short])];
}
