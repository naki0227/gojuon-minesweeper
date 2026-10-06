// Screens that are allowed to show an ad. Ads are never shown during play
// (answer input, opening cells, rematch start); only these two placements exist.
export type AdPlacement = "setup" | "result";

export type BannerAdProps = {
  placement: AdPlacement;
};
