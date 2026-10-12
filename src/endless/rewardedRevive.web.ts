// Web rewarded ads are not configured. The UI explicitly grants the
// first three revives as free preview revives on Web instead.
export async function requestRewardedRevive(): Promise<boolean> {
  return false;
}
