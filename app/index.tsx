import { useState } from "react";
import { router } from "expo-router";

import { trackEvent } from "../src/analytics/events";
import { HomeSetup } from "../src/components/HomeSetup";
import { LocalMatch } from "../src/components/LocalMatch";
import { LOCAL_MATCH_TEXT as S } from "../src/components/LocalMatch.strings";
import { LOCALE } from "../src/i18n";
import { isOnlineConfigured } from "../src/online/client";
import { pickRandomQuestion } from "../src/data/questions";
import type { QuestionFilters } from "../src/data/types";
import {
  createInitialState,
  isMineCharacter,
  openCharacter,
  passAnswer,
  submitAnswer,
  type GameState,
} from "../src/game/engine";
import { noteWinForReview } from "../src/review/askForReview";
import { localSnapshot } from "../src/sound/snapshots";
import { playSound } from "../src/sound/sounds";
import { transitionSound } from "../src/sound/transitions";

const INITIAL_FILTERS: QuestionFilters = {
  language: LOCALE === "en" ? "en" : "ja",
  categories: [],
  length: "any",
};

export default function HomeScreen() {
  const [filters, setFilters] = useState<QuestionFilters>(INITIAL_FILTERS);
  const [game, setGame] = useState<GameState | null>(null);

  function startGame(nextFilters: QuestionFilters, excludeId?: string) {
    const question = pickRandomQuestion(nextFilters, excludeId);

    if (!question) {
      return;
    }

    setFilters(nextFilters);
    setGame(createInitialState(question));

    trackEvent("game_start", {
      question_id: question.id,
      language: question.language,
      category: question.category,
      answer_length: question.length,
    });
  }

  if (!game) {
    return (
      <HomeSetup
        filters={filters}
        onChangeFilters={setFilters}
        onStart={(nextFilters) => startGame(nextFilters)}
        onOnline={
          isOnlineConfigured
            ? (nextFilters) =>
                router.push({
                  pathname: "/online",
                  params: { filters: JSON.stringify(nextFilters) },
                })
            : undefined
        }
      />
    );
  }

  function updateGame(previous: GameState, next: GameState) {
    if (previous.phase !== "finished" && next.phase === "finished") {
      trackEvent("game_finish", {
        question_id: previous.question.id,
        winner: next.winner === null ? "draw" : next.winner + 1,
      });
      if (next.winner !== null) void noteWinForReview();
    }
    playSound(transitionSound(localSnapshot(previous), localSnapshot(next)));
    setGame(next);
  }

  function handleSubmitAnswer(answer: string): boolean {
    if (!game) {
      return false;
    }

    const next = submitAnswer(game, answer);
    const correct = next.winner !== null;

    trackEvent("answer_submit", {
      question_id: game.question.id,
      player: game.currentPlayer + 1,
    });
    trackEvent(correct ? "answer_correct" : "answer_wrong", {
      question_id: game.question.id,
      player: game.currentPlayer + 1,
    });

    updateGame(game, next);
    return correct;
  }

  function handleOpen(char: string) {
    if (!game) {
      return;
    }

    trackEvent("cell_open", {
      question_id: game.question.id,
      char,
      player: game.currentPlayer + 1,
    });

    if (isMineCharacter(game.question, char)) {
      trackEvent("mine_hit", {
        question_id: game.question.id,
        char,
        player: game.currentPlayer + 1,
      });
    }

    updateGame(game, openCharacter(game, char));
  }

  return (
    <LocalMatch
      game={game}
      resultTitle={game.winner === null ? S.draw : S.win(game.winner + 1)}
      celebrate={game.winner !== null}
      onSubmit={handleSubmitAnswer}
      onPass={() => updateGame(game, passAnswer(game))}
      onOpen={handleOpen}
      onRematch={() => startGame(filters, game.question.id)}
      onChangeSettings={() => setGame(null)}
    />
  );
}
