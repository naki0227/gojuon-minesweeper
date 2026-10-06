import japaneseEntries from "./question-bank-ja.json";
import japaneseExtraEntries from "./question-bank-ja-extra.json";
import englishEntries from "./question-bank-en.json";
import englishExtraEntries from "./question-bank-en-extra.json";
import type {
  AnswerOption,
  Question,
  QuestionFilters,
  QuestionLanguage,
  RawQuestionEntry,
} from "./types";
import { normalizedLength } from "../game/normalize";
import { createSignatureKey } from "../game/signature";

const RAW_QUESTION_ENTRIES: RawQuestionEntry[] = [
  ...(japaneseEntries as RawQuestionEntry[]),
  ...(japaneseExtraEntries as RawQuestionEntry[]),
  ...(englishEntries as RawQuestionEntry[]),
  ...(englishExtraEntries as RawQuestionEntry[]),
];

function uniqueAnswers(entries: readonly RawQuestionEntry[]): AnswerOption[] {
  const seen = new Set<string>();
  const answers: AnswerOption[] = [];

  for (const entry of entries) {
    const key = `${entry.display}::${entry.value}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    answers.push({
      display: entry.display,
      value: entry.value,
      aliases: [...new Set([entry.display, entry.value, ...(entry.aliases ?? [])])],
    });
  }

  return answers;
}

function buildQuestionBank(entries: readonly RawQuestionEntry[]): Question[] {
  const groups = new Map<string, RawQuestionEntry[]>();

  for (const entry of entries) {
    const length = normalizedLength(entry.value, entry.language);
    const signature = createSignatureKey(entry.value, entry.language);
    const groupKey = [
      entry.language,
      entry.category,
      length,
      signature,
    ].join("::");

    const group = groups.get(groupKey) ?? [];
    group.push(entry);
    groups.set(groupKey, group);
  }

  return [...groups.values()].map((group) => {
    const primary = group[0]!;

    return {
      id: primary.id,
      language: primary.language,
      category: primary.category,
      length: normalizedLength(primary.value, primary.language),
      signature: createSignatureKey(primary.value, primary.language),
      answers: uniqueAnswers(group),
    };
  });
}

export const QUESTIONS: readonly Question[] = buildQuestionBank(
  RAW_QUESTION_ENTRIES,
);

export function primaryAnswer(question: Question): AnswerOption {
  const answer = question.answers[0];

  if (!answer) {
    throw new Error(`Question ${question.id} has no answers`);
  }

  return answer;
}

export function questionPrompt(question: Question): string {
  if (question.language === "en") {
    return `${question.length}文字の英単語・${question.category}`;
  }

  return `${question.length}文字の${question.category}`;
}

export function filterQuestions(
  filters: QuestionFilters,
): readonly Question[] {
  return QUESTIONS.filter((question) => {
    if (
      filters.language !== "any" &&
      question.language !== filters.language
    ) {
      return false;
    }

    if (
      filters.category !== "any" &&
      question.category !== filters.category
    ) {
      return false;
    }

    if (filters.length !== "any" && question.length !== filters.length) {
      return false;
    }

    return true;
  });
}

export function getCategories(
  language: QuestionLanguage | "any",
): readonly string[] {
  return [
    ...new Set(
      QUESTIONS.filter(
        (question) => language === "any" || question.language === language,
      ).map((question) => question.category),
    ),
  ].sort((left, right) => left.localeCompare(right, "ja"));
}

export function getAvailableLengths(
  filters: Pick<QuestionFilters, "language" | "category">,
): readonly number[] {
  return [
    ...new Set(
      QUESTIONS.filter((question) => {
        if (
          filters.language !== "any" &&
          question.language !== filters.language
        ) {
          return false;
        }

        if (
          filters.category !== "any" &&
          question.category !== filters.category
        ) {
          return false;
        }

        return true;
      }).map((question) => question.length),
    ),
  ].sort((left, right) => left - right);
}

export function countQuestions(filters: QuestionFilters): number {
  return filterQuestions(filters).length;
}

export function pickRandomQuestion(
  filters: QuestionFilters,
  excludeId?: string,
): Question | null {
  const pool = filterQuestions(filters);
  const candidates =
    pool.length > 1 && excludeId
      ? pool.filter((question) => question.id !== excludeId)
      : pool;

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}
