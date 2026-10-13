// Apple server APIs used by the wallet: App Store Server API (transactions)
// and Sign in with Apple token revocation (account deletion).
// Gem consumables. The database decides how many gems each one credits.
export const GEM_PRODUCT_IDS: readonly string[] = [
  "com.naki0227.gojuonminesweeper.gems10",
  "com.naki0227.gojuonminesweeper.gems30",
  "com.naki0227.gojuonminesweeper.gems70",
  "com.naki0227.gojuonminesweeper.gems385",
  "com.naki0227.gojuonminesweeper.gems1000",
];
export const BUNDLE_ID = "com.naki0227.gojuonminesweeper";

export class ClientError extends Error {}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4, "=",
  );
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}
function encodeBase64Url(bytes: Uint8Array) {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function encodedJson(value: unknown) {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

// Reads a JWS/JWT payload WITHOUT checking its signature. Use only on data
// fetched from Apple over TLS, or as a lookup hint that is re-checked there.
export function unverifiedPayload<T>(jws: unknown): T | null {
  const parts = typeof jws === "string" ? jws.split(".") : [];
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as T;
  } catch {
    return null;
  }
}

async function signEs256(
  rawKey: string, keyId: string, claims: Record<string, unknown>,
) {
  const der = decodeBase64Url(
    rawKey.replace(/\\n/g, "\n")
      .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")
      .replace(/\+/g, "-").replace(/\//g, "_"),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
  const unsigned = [
    encodedJson({ alg: "ES256", kid: keyId, typ: "JWT" }),
    encodedJson(claims),
  ].join(".");
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key, new TextEncoder().encode(unsigned),
  );
  return unsigned + "." + encodeBase64Url(new Uint8Array(signature));
}

function appStoreToken() {
  const issuer = Deno.env.get("APPLE_IAP_ISSUER_ID");
  const keyId = Deno.env.get("APPLE_IAP_KEY_ID");
  const raw = Deno.env.get("APPLE_IAP_PRIVATE_KEY");
  if (!issuer || !keyId || !raw) throw new Error("App Store API not configured");
  const now = Math.floor(Date.now() / 1000);
  return signEs256(raw, keyId, {
    iss: issuer, iat: now, exp: now + 300, aud: "appstoreconnect-v1",
    bid: BUNDLE_ID,
  });
}

export type AppleTransaction = {
  transactionId?: string;
  originalTransactionId?: string;
  productId?: string;
  bundleId?: string;
  appAccountToken?: string;
  environment?: string;
  type?: string;
  purchaseDate?: number;
  revocationDate?: number;
};

export async function queryApple(transactionId: string): Promise<AppleTransaction> {
  const bearer = await appStoreToken();
  let result: Response | null = null;
  for (const host of ["https://api.storekit.apple.com", "https://api.storekit-sandbox.apple.com"]) {
    const response = await fetch(
      host + "/inApps/v1/transactions/" + encodeURIComponent(transactionId),
      { headers: { Authorization: "Bearer " + bearer } },
    );
    if (response.status === 404) continue;
    if (!response.ok) throw new Error("Apple verification HTTP " + response.status);
    result = response;
    break;
  }
  if (!result) throw new ClientError("購入情報をAppleに確認できませんでした。");
  const json = await result.json() as { signedTransactionInfo?: string };
  // The JWS is obtained directly from Apple's authenticated, TLS-protected
  // App Store Server API, not from client-supplied signedTransactionInfo.
  const transaction = unverifiedPayload<AppleTransaction>(json.signedTransactionInfo);
  if (!transaction) throw new Error("Invalid Apple API payload");
  return transaction;
}

// App Store Server Notifications V2 body: { signedPayload }. Only the
// transaction ID is taken from it; the caller re-reads the transaction from
// Apple's API, so a forged notification can't change anything.
export function notificationTransactionId(body: Record<string, unknown>): string | null {
  const payload = unverifiedPayload<{
    data?: { bundleId?: string; signedTransactionInfo?: string };
  }>(body.signedPayload);
  if (!payload?.data || payload.data.bundleId !== BUNDLE_ID) return null;
  const transaction = unverifiedPayload<AppleTransaction>(
    payload.data.signedTransactionInfo,
  );
  const id = transaction?.transactionId;
  return typeof id === "string" && /^[0-9]{6,30}$/.test(id) ? id : null;
}

// Sign in with Apple requires apps to revoke the user's tokens when the
// account is deleted. Needs a "Sign in with Apple" key; returns false when
// it is not configured or Apple refuses, and the deletion still proceeds.
export async function revokeAppleSignIn(authorizationCode: string): Promise<boolean> {
  const teamId = Deno.env.get("APPLE_SIGNIN_TEAM_ID");
  const keyId = Deno.env.get("APPLE_SIGNIN_KEY_ID");
  const raw = Deno.env.get("APPLE_SIGNIN_PRIVATE_KEY");
  if (!teamId || !keyId || !raw || !authorizationCode) return false;
  const now = Math.floor(Date.now() / 1000);
  const clientSecret = await signEs256(raw, keyId, {
    iss: teamId, iat: now, exp: now + 300, aud: "https://appleid.apple.com",
    sub: BUNDLE_ID,
  });
  const form = (fields: Record<string, string>) => ({
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: BUNDLE_ID, client_secret: clientSecret, ...fields,
    }),
  });
  const tokenResponse = await fetch("https://appleid.apple.com/auth/token", form({
    grant_type: "authorization_code", code: authorizationCode,
  }));
  if (!tokenResponse.ok) return false;
  const tokens = await tokenResponse.json() as { refresh_token?: string };
  if (!tokens.refresh_token) return false;
  const revoked = await fetch("https://appleid.apple.com/auth/revoke", form({
    token: tokens.refresh_token, token_type_hint: "refresh_token",
  }));
  return revoked.ok;
}
