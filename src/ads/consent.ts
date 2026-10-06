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

// UMP reports whether this user must be offered a way to change their ad
// consent later (e.g. in the EEA / UK). Only then is the entry shown.
export function isPrivacyOptionsRequired(
  status: string | undefined | null,
): boolean {
  return status === "REQUIRED";
}
