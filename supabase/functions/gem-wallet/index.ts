// Server-authoritative iOS consumable wallet.
// Never accept prices, credits, account ownership, or Apple environment from the client.
import { createClient } from "npm:@supabase/supabase-js@2";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const PRODUCT_ID = "com.naki0227.gojuonminesweeper.gems10";
const BUNDLE_ID = "com.naki0227.gojuonminesweeper";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
class ClientError extends Error {}

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}
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

async function appStoreToken() {
  const issuer = Deno.env.get("APPLE_IAP_ISSUER_ID");
  const keyId = Deno.env.get("APPLE_IAP_KEY_ID");
  const raw = Deno.env.get("APPLE_IAP_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!issuer || !keyId || !raw) throw new Error("App Store API not configured");

  const der = decodeBase64Url(
    raw.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")
      .replace(/\+/g, "-").replace(/\//g, "_"),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const unsigned = [
    encodedJson({ alg: "ES256", kid: keyId, typ: "JWT" }),
    encodedJson({
      iss: issuer, iat: now, exp: now + 300, aud: "appstoreconnect-v1",
      bid: BUNDLE_ID,
    }),
  ].join(".");
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key, new TextEncoder().encode(unsigned),
  );
  return unsigned + "." + encodeBase64Url(new Uint8Array(signature));
}

type AppleTransaction = {
  transactionId?: string;
  productId?: string;
  bundleId?: string;
  appAccountToken?: string;
  environment?: string;
  type?: string;
  purchaseDate?: number;
  revocationDate?: number;
};
async function requestUuid(accountId: string, actionId: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest(
    "SHA-256", new TextEncoder().encode(accountId + ":" + actionId),
  ));
  // Deterministic UUID for PostgreSQL's idempotent debit, never client trust.
  hash[6] = (hash[6] & 0x0f) | 0x40;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = Array.from(hash.slice(0, 16), (x) => x.toString(16).padStart(2, "0")).join("");
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16),
    hex.slice(16, 20), hex.slice(20)].join("-");
}

async function queryApple(transactionId: string): Promise<AppleTransaction> {
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
  const parts = json.signedTransactionInfo?.split(".");
  if (!parts || parts.length !== 3) throw new Error("Invalid Apple API payload");
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as AppleTransaction;
}

function readString(value: unknown, max = 128): string {
  return typeof value === "string" && value.length <= max ? value : "";
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (request.method !== "POST") return respond({ ok: false, error: "Method not allowed" }, 405);
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return respond({ ok: false, error: "Appleログインが必要です。" }, 401);
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    const user = userData.user;
    if (authError || !user || user.is_anonymous ||
      !Array.isArray(user.app_metadata?.providers) ||
      !user.app_metadata.providers.includes("apple")) {
      return respond({ ok: false, error: "Appleでログインしてください。" }, 401);
    }

    const body = await request.json() as Record<string, unknown>;
    const action = readString(body.action);
    if (action === "balance") {
      // The caller has a verified Apple identity. Grant three gems once per
      // account on first wallet access; retries and reinstalls never re-credit.
      const { data, error } = await admin.rpc("gem_credit_apple_signin_bonus", {
        p_user_id: user.id,
      });
      if (error) throw error;
      return respond({ ok: true, balance: data });
    }
    if (action === "spend") {
      const reason = readString(body.reason);
      const actionId = readString(body.actionId);
      const amount = reason === "hint" ? 1 : reason === "revive" ? 3 : 0;
      if (!amount || !/^[a-zA-Z0-9:_-]{8,120}$/.test(actionId)) {
        throw new ClientError("消費内容が正しくありません。");
      }
      const { data, error } = await admin.rpc("gem_spend", {
        p_user_id: user.id,
        p_request_id: await requestUuid(user.id, actionId),
        p_reason: reason === "hint" ? "safe_hint" : "revive",
      });
      if (error) {
        if (error.message.includes("Insufficient gems")) {
          throw new ClientError("ジェムが足りません。");
        }
        throw error;
      }
      return respond({ ok: true, balance: data });
    }
    if (action === "verify") {
      const transactionId = readString(body.transactionId, 30);
      if (!/^[0-9]{6,30}$/.test(transactionId)) {
        throw new ClientError("購入情報が正しくありません。");
      }
      const signed = await queryApple(transactionId);
      if (signed.transactionId !== transactionId ||
        signed.bundleId !== BUNDLE_ID || signed.productId !== PRODUCT_ID ||
        signed.appAccountToken?.toLowerCase() !== user.id.toLowerCase() ||
        signed.type !== "Consumable" ||
        !Number.isSafeInteger(signed.purchaseDate) ||
        signed.revocationDate !== undefined) {
        throw new ClientError("このApple購入はこのアカウントに付与できません。");
      }
      const environment = signed.environment;
      if (environment !== "Production" && environment !== "Sandbox") {
        throw new ClientError("購入の検証環境が不明です。");
      }
      const { data, error } = await admin.rpc("gem_credit_apple_purchase", {
        p_user_id: user.id, p_transaction_id: transactionId,
        p_product_id: PRODUCT_ID, p_environment: environment,
        p_purchased_at: new Date(signed.purchaseDate!).toISOString(),
      });
      if (error) throw error;
      return respond({ ok: true, balance: data });
    }
    throw new ClientError("不明な操作です。");
  } catch (error) {
    if (error instanceof ClientError) {
      return respond({ ok: false, error: error.message }, 400);
    }
    // Do not return Apple auth keys, transaction payloads, JWTs, or SQL errors.
    console.error("gem-wallet action failed", error instanceof Error ? error.name : "unknown");
    return respond({ ok: false, error: "処理できませんでした。後ほど再試行してください。" }, 500);
  }
});
