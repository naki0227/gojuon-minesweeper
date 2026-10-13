import { Platform, Share } from "react-native";

import { inviteMessage, inviteUrl } from "./invite";

export type ShareResult = "shared" | "copied" | "failed";

// Opens the share sheet with the invite link. Browsers without a share
// sheet copy the link instead.
export async function shareInvite(code: string): Promise<ShareResult> {
  if (Platform.OS !== "web") {
    try {
      await Share.share({ message: inviteMessage(code) });
      return "shared";
    } catch {
      return "failed";
    }
  }
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  if (nav?.share) {
    try {
      await nav.share({ text: inviteMessage(code) });
      return "shared";
    } catch (error) {
      // The user closed the sheet; nothing to copy.
      if (error instanceof Error && error.name === "AbortError") {
        return "failed";
      }
    }
  }
  try {
    await nav?.clipboard.writeText(inviteUrl(code));
    return "copied";
  } catch {
    return "failed";
  }
}
