export type QuestionLanguage = "ja" | "en";

export type RawQuestionEntry = {
  id: string;
  language: QuestionLanguage;
  category: string;
  display: string;
  value: string;
  aliases?: readonly string[];
};

export type AnswerOption = {
  display: string;
  value: string;
  aliases: readonly string[];
};

export type Question = {
  id: string;
  language: QuestionLanguage;
  category: string;
  length: number;
  signature: string;
  answers: readonly AnswerOption[];
};

// A word length range in characters; max null means "and longer".
export type LengthRange = { min: number; max: number | null };

export type LengthFilter = number | "any" | LengthRange;

export type QuestionFilters = {
  language: QuestionLanguage | "any";
  categories: readonly string[];
  length: LengthFilter;
};
