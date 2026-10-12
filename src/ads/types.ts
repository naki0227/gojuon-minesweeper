// Only one banner per screen. Experimental during-play placements keep
// their banners separated from interactive controls.
export type AdPlacement = "setup" | "result";

export type BannerAdProps = {
  placement: AdPlacement;
  /** Reserve separation between an interactive game and its ad unit. */
  duringPlay?: boolean;
};
