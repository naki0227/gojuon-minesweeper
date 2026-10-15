import { questionPrompt, questionPromptEn } from "../data/questions";
import type { Question } from "../data/types";
import type { GameState } from "../game/engine";
import { LOCALE, tr } from "./index";

// Helpers for text that the shared game code (also run by the online
// server) keeps in both languages.
export function promptText(question: Question): string {
  return tr({ ja: questionPrompt(question), en: questionPromptEn(question) });
}

export function gameMessage(
  state: Pick<GameState, "lastMessage"> & { lastMessageEn?: string },
): string {
  return LOCALE === "en" && state.lastMessageEn
    ? state.lastMessageEn
    : state.lastMessage;
}
