import { SITE_URL } from "../links/site";
import { normalizeRoomCode } from "./protocol";

// Letters that are hard to mix up when read aloud or retyped.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 8;

export function randomInviteCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  }
  return code;
}

// The link a friend opens to join the room. It opens the app when it is
// installed (Universal Links) and the web version otherwise.
export function inviteUrl(code: string): string {
  return `${SITE_URL}/online?join=${encodeURIComponent(code)}`;
}

export function inviteMessage(code: string): string {
  return `五十音マインスイーパーで対戦しよう！\n${inviteUrl(code)}`;
}

// The room code from an invite link's `join` parameter, or null.
export function joinCodeFromParam(raw: string | string[] | undefined) {
  return typeof raw === "string" ? normalizeRoomCode(raw) : null;
}
