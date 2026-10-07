import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { callOnline, ensureSignedIn, fetchRoom, subscribeRoom } from "./client";
import { seatOf, type OnlineRequest, type OnlineRoom } from "./protocol";

// How often a random-match player asks the server to pair them again, and
// how often any open room is re-read in case a Realtime update was missed.
const QUICK_MATCH_RETRY_MS = 4000;
const REFRESH_MS = 15000;
// Extra wait after the opponent's deadline before claiming the win, so a
// slightly slow clock doesn't end the game early.
const TIMEOUT_GRACE_MS = 2000;

function isNewer(current: OnlineRoom, next: OnlineRoom): boolean {
  if (next.version !== current.version) {
    return next.version > current.version;
  }
  return Date.parse(next.updated_at) >= Date.parse(current.updated_at);
}

export function useOnlineRoom() {
  const [userId, setUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const claimedDeadline = useRef<string | null>(null);

  const accept = useCallback((next: OnlineRoom | null) => {
    setRoom((current) => {
      if (!next) {
        return null;
      }
      if (current && current.id === next.id && !isNewer(current, next)) {
        return current;
      }
      return next;
    });
  }, []);

  const run = useCallback(
    async (request: OnlineRequest, quiet = false) => {
      if (!quiet) {
        setBusy(true);
        setError(null);
      }
      try {
        setUserId(await ensureSignedIn());
        const next = await callOnline(request);
        accept(next);
        return next;
      } catch (caught) {
        if (!quiet) {
          setError(
            caught instanceof Error ? caught.message : "通信できませんでした。",
          );
        }
        return null;
      } finally {
        if (!quiet) {
          setBusy(false);
        }
      }
    },
    [accept],
  );

  const roomId = room?.id ?? null;
  const status = room?.status ?? null;
  const kind = room?.kind ?? null;
  const matchKey = room?.match_key ?? null;

  // Live updates for the open room, plus a slow re-read as a safety net and
  // a re-read whenever the app comes back to the foreground.
  useEffect(() => {
    if (!roomId || status === "closed") {
      return;
    }
    const refresh = () => {
      void fetchRoom(roomId).then((next) => next && accept(next));
    };
    const unsubscribe = subscribeRoom(roomId, accept);
    const interval = setInterval(refresh, REFRESH_MS);
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
      }
    });
    return () => {
      unsubscribe();
      clearInterval(interval);
      appState.remove();
    };
  }, [accept, roomId, status]);

  // A random-match player keeps asking to be paired with someone who
  // queued earlier.
  useEffect(() => {
    if (!roomId || status !== "waiting" || kind !== "random" || !matchKey) {
      return;
    }
    const language = matchKey === "en" || matchKey === "any" ? matchKey : "ja";
    const interval = setInterval(() => {
      void run({ action: "quick_match", language, roomId }, true);
    }, QUICK_MATCH_RETRY_MS);
    return () => clearInterval(interval);
  }, [kind, matchKey, roomId, run, status]);

  // Clock for the turn timer.
  useEffect(() => {
    if (status !== "playing") {
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const seat = room && userId ? seatOf(room, userId) : null;
  const deadline = room?.turn_deadline ? Date.parse(room.turn_deadline) : null;
  const secondsLeft =
    deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));
  const opponentOnTurn =
    room?.status === "playing" &&
    seat !== null &&
    room.public_state?.currentPlayer !== seat;

  // When the opponent runs out of time (or vanished), claim the win once.
  useEffect(() => {
    if (
      !roomId ||
      !opponentOnTurn ||
      deadline === null ||
      now < deadline + TIMEOUT_GRACE_MS ||
      claimedDeadline.current === room?.turn_deadline
    ) {
      return;
    }
    claimedDeadline.current = room?.turn_deadline ?? null;
    void run({ action: "claim_timeout", roomId }, true);
  }, [deadline, now, opponentOnTurn, room?.turn_deadline, roomId, run]);

  return {
    room,
    seat,
    busy,
    error,
    secondsLeft,
    run,
    clearError: () => setError(null),
    reset: () => {
      setRoom(null);
      setError(null);
    },
  };
}
