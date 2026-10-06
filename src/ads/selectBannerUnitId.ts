export function selectBannerUnitId(
  useTestIds: boolean,
  configuredId: string | null,
  testId: string,
): string | null {
  return useTestIds ? testId : configuredId;
}
