// Screens that are allowed to show an ad; one banner per screen. A banner
// shown while a match is in progress sits below the game with extra space,
// never over or next to the controls. Endless mode has no banner.
export type AdPlacement = "setup" | "result";

export type BannerAdProps = {
  placement: AdPlacement;
  /** Keep a gap between an in-progress game's controls and the ad. */
  duringPlay?: boolean;
};

// Banner props for a match screen: "result" once decided, otherwise
// "setup", spaced away from the controls while the match is being played.
export function matchBanner(
  phase: string | undefined,
  status: string = "playing",
): BannerAdProps {
  const finished = phase === "finished";
  return {
    placement: finished ? "result" : "setup",
    duringPlay: status === "playing" && !finished,
  };
}
