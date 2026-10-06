type ConsentStatus = { canRequestAds: boolean };

type ConsentProvider = {
  gatherConsent: () => Promise<ConsentStatus>;
  getConsentInfo: () => Promise<ConsentStatus>;
};

export async function canRequestAds(
  provider: ConsentProvider,
): Promise<boolean> {
  try {
    return (await provider.gatherConsent()).canRequestAds;
  } catch {
    try {
      return (await provider.getConsentInfo()).canRequestAds;
    } catch {
      return false;
    }
  }
}
