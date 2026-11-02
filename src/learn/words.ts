import type { Question } from "../data/types";
import { buildCustomQuestion } from "../custom/question";
import rawWords from "./words-en.json";
import { romajiSpellings } from "./romaji";

// A beginner word for the kana mode: shown in English, guessed in kana
// (or romaji). The list is written for this app (no outside word list).
export type LearnWord = {
  id: string;
  reading: string;
  display: string;
  meaning: string;
  topic: string;
};

export const LEARN_WORDS = rawWords as LearnWord[];

export function learnQuestion(word: LearnWord): Question {
  const question = buildCustomQuestion({
    language: "ja",
    reading: word.reading,
    display: word.display,
    hint: word.meaning,
  });
  if (!question) throw new Error(`Bad learn word ${word.id}`);
  const [answer] = question.answers;
  return {
    ...question,
    id: word.id,
    answers: [
      {
        ...answer!,
        aliases: [
          ...new Set([...answer!.aliases, ...romajiSpellings(word.reading)]),
        ],
      },
    ],
  };
}
