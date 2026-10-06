import japaneseEntries from "./question-bank-ja.json";
import japaneseExtraEntries from "./question-bank-ja-extra.json";
import englishEntries from "./question-bank-en.json";
import englishExtraEntries from "./question-bank-en-extra.json";
import everydayEntries from "./question-bank-everyday.json";
import englishTopicEntries1 from "./question-bank-en-topics-1.json";
import englishTopicEntries2 from "./question-bank-en-topics-2.json";
import englishTopicEntries3 from "./question-bank-en-topics-3.json";
import englishTopicEntries4 from "./question-bank-en-topics-4.json";
import englishTopicEntries5 from "./question-bank-en-topics-5.json";
import englishTopicEntries6 from "./question-bank-en-topics-6.json";
import type {
  AnswerOption,
  Question,
  LengthFilter,
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
  ...(everydayEntries as RawQuestionEntry[]),
  ...(englishTopicEntries1 as RawQuestionEntry[]),
  ...(englishTopicEntries2 as RawQuestionEntry[]),
  ...(englishTopicEntries3 as RawQuestionEntry[]),
  ...(englishTopicEntries4 as RawQuestionEntry[]),
  ...(englishTopicEntries5 as RawQuestionEntry[]),
  ...(englishTopicEntries6 as RawQuestionEntry[]),
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
      aliases: [
        ...new Set([entry.display, entry.value, ...(entry.aliases ?? [])]),
      ],
    });
  }

  return answers;
}

function buildQuestionBank(entries: readonly RawQuestionEntry[]): Question[] {
  const groups = new Map<string, RawQuestionEntry[]>();

  for (const entry of entries) {
    const length = normalizedLength(entry.value, entry.language);
    const signature = createSignatureKey(entry.value, entry.language);
    const groupKey = [entry.language, entry.category, length, signature].join(
      "::",
    );

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

export const QUESTIONS: readonly Question[] =
  buildQuestionBank(RAW_QUESTION_ENTRIES);

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

export function matchesLength(length: number, filter: LengthFilter): boolean {
  if (filter === "any") {
    return true;
  }
  if (typeof filter === "number") {
    return length === filter;
  }
  return length >= filter.min && (filter.max === null || length <= filter.max);
}

export function filterQuestions(filters: QuestionFilters): readonly Question[] {
  return QUESTIONS.filter((question) => {
    if (filters.language !== "any" && question.language !== filters.language) {
      return false;
    }

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(question.category)
    ) {
      return false;
    }

    if (!matchesLength(question.length, filters.length)) {
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
  filters: Pick<QuestionFilters, "language" | "categories">,
): readonly number[] {
  return [
    ...new Set(
      filterQuestions({ ...filters, length: "any" }).map(
        (question) => question.length,
      ),
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

  const byCategory = new Map<string, Question[]>();
  for (const question of candidates) {
    const key = `${question.language}:${question.category}`;
    const questions = byCategory.get(key) ?? [];
    questions.push(question);
    byCategory.set(key, questions);
  }

  const categoryPools = [...byCategory.values()];
  const chosenPool =
    categoryPools[Math.floor(Math.random() * categoryPools.length)];
  return chosenPool?.[Math.floor(Math.random() * chosenPool.length)] ?? null;
}
