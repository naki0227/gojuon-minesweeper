// When to ask for an App Store rating: after a few wins, so players who
// ask are ones having a good time, and not again for a while. iOS also
// shows the prompt at most three times a year on its own.
export const WINS_BEFORE_ASKING = 3;
export const ASK_AGAIN_AFTER_MS = 120 * 24 * 60 * 60 * 1000;

export type ReviewState = { wins: number; askedAt: number | null };

export const INITIAL_REVIEW_STATE: ReviewState = { wins: 0, askedAt: null };

export function parseReviewState(raw: string | null): ReviewState {
  try {
    const value = JSON.parse(raw ?? "") as Partial<ReviewState>;
    return {
      wins: typeof value.wins === "number" ? value.wins : 0,
      askedAt: typeof value.askedAt === "number" ? value.askedAt : null,
    };
  } catch {
    return INITIAL_REVIEW_STATE;
  }
}

// Counts one more win and says whether to ask now.
export function afterWin(
  state: ReviewState,
  now: number,
): { state: ReviewState; ask: boolean } {
  const wins = state.wins + 1;
  const due =
    state.askedAt === null || now - state.askedAt >= ASK_AGAIN_AFTER_MS;
  const ask = wins >= WINS_BEFORE_ASKING && due;
  return {
    state: { wins: ask ? 0 : wins, askedAt: ask ? now : state.askedAt },
    ask,
  };
}
