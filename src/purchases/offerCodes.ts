// In-app offer code redemption for non-consumable IAPs needs iOS 16.3+.
// (The current Expo SDK already requires a newer iOS, so this mainly guards
// against a lowered deployment target.)
const MIN_IOS_VERSION: readonly [number, number] = [16, 3];

export function supportsInAppOfferCodes(
  os: string,
  version: string | number,
): boolean {
  if (os !== "ios") {
    return false;
  }

  const [major = 0, minor = 0] = String(version)
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

  return (
    major > MIN_IOS_VERSION[0] ||
    (major === MIN_IOS_VERSION[0] && minor >= MIN_IOS_VERSION[1])
  );
}
