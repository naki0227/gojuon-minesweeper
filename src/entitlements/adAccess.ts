import type { RemoveAdsStatus } from "../purchases/RemoveAdsProvider";

export function isOwnershipResolved(
  status: RemoveAdsStatus,
  platform: string,
): boolean {
  return status === "ready" || (platform === "web" && status === "unavailable");
}
