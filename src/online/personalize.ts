// The server writes "Player 1" / "Player 2"; each device reads them as
// "あなた" / "相手".
export function personalize(text: string, seat: number | null): string {
  return text.replace(/Player ([12])\s?/g, (_match, number: string) =>
    Number(number) - 1 === seat ? "あなた" : "相手",
  );
}
