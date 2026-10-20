// Seasonal looks, switched on by date so they come and go without a
// release. Dates are YYYY-MM-DD in Japan time (the 今日の一問 date).
export type Season = "halloween";

// The week up to Halloween, plus 11/1 to close the Halloween puzzle week.
export function seasonOf(date: string): Season | null {
  const monthDay = date.slice(5);
  return (monthDay >= "10-24" && monthDay <= "10-31") || monthDay === "11-01"
    ? "halloween"
    : null;
}

// A night sky with a pumpkin accent. The board tiles keep the game's own
// colors, so the puzzle reads the same as on any other day.
export const HALLOWEEN = {
  night: "#21173a",
  dusk: "#3a2458",
  moon: "#ffe9a8",
  pumpkin: "#f08a24",
  text: "#fff7ec",
  sub: "#d8c8f0",
  // Ink for the 五十音 logo tiles: a deep violet instead of navy.
  tile: "#2b1d47",
} as const;
