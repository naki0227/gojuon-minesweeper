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

export type QuestionFilters = {
  language: QuestionLanguage | "any";
  category: string | "any";
  length: number | "any";
};
