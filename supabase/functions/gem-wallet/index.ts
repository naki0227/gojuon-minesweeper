// Server-authoritative iOS consumable wallet.
// Never accept prices, credits, account ownership, or Apple environment from the client.
import { createClient } from "npm:@supabase/supabase-js@2";

import {
  BUNDLE_ID,
  ClientError,
  notificationTransactionId,
  GEM_PRODUCT_IDS,
  queryApple,
  revokeAppleSignIn,
} from "./apple.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}
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

// App Store Server Notifications V2 (configured in App Store Connect to
// POST here). Refunds and revocations take back up to 10 gems, never below
// zero. The transaction is re-read from Apple before anything changes.
async function handleNotification(body: Record<string, unknown>) {
  const transactionId = notificationTransactionId(body);
  if (!transactionId) return respond({ ok: true });
  const { data: known, error } = await admin.from("gem_apple_purchases")
    .select("transaction_id").eq("transaction_id", transactionId).maybeSingle();
  if (error) throw error;
  if (!known) return respond({ ok: true });
  const signed = await queryApple(transactionId);
  if (signed.transactionId === transactionId &&
    GEM_PRODUCT_IDS.includes(signed.productId ?? "") && signed.bundleId === BUNDLE_ID &&
    Number.isSafeInteger(signed.revocationDate)) {
    const { error: revokeError } = await admin.rpc("gem_revoke_apple_purchase", {
      p_transaction_id: transactionId,
      p_revoked_at: new Date(signed.revocationDate!).toISOString(),
    });
    if (revokeError) throw revokeError;
  }
  return respond({ ok: true });
}

function readString(value: unknown, max = 128): string {
  return typeof value === "string" && value.length <= max ? value : "";
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (request.method !== "POST") return respond({ ok: false, error: "Method not allowed" }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    // Apple's server-to-server notifications carry no user token.
    if (typeof body.signedPayload === "string") return await handleNotification(body);

    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return respond({ ok: false, error: "Appleログインが必要です。" }, 401);
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    const user = userData.user;
    if (authError || !user || user.is_anonymous ||
      !Array.isArray(user.app_metadata?.providers) ||
      !user.app_metadata.providers.includes("apple")) {
      return respond({ ok: false, error: "Appleでログインしてください。" }, 401);
    }

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
        signed.bundleId !== BUNDLE_ID || !GEM_PRODUCT_IDS.includes(signed.productId ?? "") ||
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
        p_product_id: signed.productId, p_environment: environment,
        p_purchased_at: new Date(signed.purchaseDate!).toISOString(),
      });
      if (error) throw error;
      return respond({ ok: true, balance: data });
    }
    if (action === "delete_account") {
      // The wallet and ledger are deleted with the user. Apple purchase
      // records stay (without the user) so a transaction can't be reused.
      const appleRevoked = await revokeAppleSignIn(
        readString(body.authorizationCode, 512),
      ).catch(() => false);
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) throw error;
      return respond({ ok: true, appleRevoked });
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
