import { normalizedLength } from "../game/normalize";

export type Question = {
  id: string;
  category: string;
  answers: readonly string[];
};

export const QUESTIONS: readonly Question[] = [
  { id: "sport-table-tennis", category: "スポーツ", answers: ["たっきゅう"] },
  { id: "sport-soccer", category: "スポーツ", answers: ["さっかー"] },
  { id: "sport-rugby", category: "スポーツ", answers: ["らぐびー"] },
  { id: "sport-sumo", category: "スポーツ", answers: ["すもう"] },
  { id: "food-onigiri", category: "食べ物", answers: ["おにぎり"] },
  { id: "food-takoyaki", category: "食べ物", answers: ["たこやき"] },
  { id: "food-karaage", category: "食べ物", answers: ["からあげ"] },
  { id: "food-hamburg", category: "食べ物", answers: ["はんばーぐ"] },
  { id: "food-curry", category: "食べ物", answers: ["かれー"] },
  { id: "animal-giraffe", category: "動物", answers: ["きりん"] },
  { id: "animal-penguin", category: "動物", answers: ["ぺんぎん"] },
  { id: "animal-capybara", category: "動物", answers: ["かぴばら"] },
  { id: "animal-lion", category: "動物", answers: ["らいおん"] },
  { id: "animal-polar-bear", category: "動物", answers: ["しろくま"] }
];

export function primaryAnswer(question: Question): string {
  const answer = question.answers[0];

  if (!answer) {
    throw new Error(`Question ${question.id} has no answers`);
  }

  return answer;
}

export function questionPrompt(question: Question): string {
  return `${normalizedLength(primaryAnswer(question))}文字の${question.category}`;
}
