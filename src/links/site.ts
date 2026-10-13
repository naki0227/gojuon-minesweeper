// Public URLs of the app's website and its App Store page.
export const SITE_URL = "https://minesweeper.enludus.com";
export const APP_STORE_ID = "6819539119";

// App Store Connect "provider token" for campaign links. Campaign links
// (ct=...) show in App Analytics only with it; without it they still work.
const APP_STORE_PROVIDER_TOKEN = "";

// Where an App Store visit came from, as seen in App Analytics > Campaigns.
export type AppStoreCampaign = "web_home" | "web_invite" | "web_daily";

export function appStoreUrl(campaign: AppStoreCampaign): string {
  const params = new URLSearchParams({ ct: campaign, mt: "8" });
  if (APP_STORE_PROVIDER_TOKEN) {
    params.set("pt", APP_STORE_PROVIDER_TOKEN);
  }
  return `https://apps.apple.com/jp/app/id${APP_STORE_ID}?${params}`;
}
