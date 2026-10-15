import { LOCALE } from "../i18n";

// The server writes "Player 1" / "Player 2"; each device reads them as
// "あなた" / "相手".
export function personalize(text: string, seat: number | null): string {
  if (LOCALE === "en") {
    return personalizeEn(text, seat);
  }
  return text.replace(/Player ([12])\s?/g, (_match, number: string) =>
    Number(number) - 1 === seat ? "あなた" : "相手",
  );
}

// English messages (src/game/engine.ts, concedeGame in rules.ts) put
// "Player N" at the start of a sentence, so "You" / "Your opponent" fit,
// with a few verbs fixed for "You".
function personalizeEn(text: string, seat: number | null): string {
  const isMe = (number: string) => Number(number) - 1 === seat;
  return text
    .replace(/Player ([12])'s turn/g, (_match, number: string) =>
      isMe(number) ? "Your turn" : "Your opponent's turn",
    )
    .replace(/Player ([12]) to answer/g, (_match, number: string) =>
      isMe(number) ? "Your turn to answer" : "Your opponent's turn to answer",
    )
    .replace(/Player ([12])/g, (_match, number: string) =>
      isMe(number) ? "You" : "Your opponent",
    )
    .replace(/\bYou (goes|skips|wins)\b/g, (_match, verb: string) =>
      verb === "goes" ? "You go" : `You ${verb.slice(0, -1)}`,
    );
}
