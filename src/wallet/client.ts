import { getSupabase, isOnlineConfigured } from "../online/client";

export const GEMS_PRODUCT_ID = "com.naki0227.gojuonminesweeper.gems10";
export const isGemWalletConfigured = isOnlineConfigured;

type WalletResponse =
  { ok: true; balance: number } | { ok: false; error: string };

export async function currentAppleAccount(): Promise<string | null> {
  if (!isGemWalletConfigured) return null;
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user || data.user.is_anonymous) return null;
  const providers = data.user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("apple")
    ? data.user.id
    : null;
}

async function walletAction(body: Record<string, string>): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke<WalletResponse>(
    "gem-wallet",
    { body },
  );
  if (error) {
    const context = (error as { context?: Response }).context;
    const response = (await context?.json?.().catch(() => null)) as
      WalletResponse | null | undefined;
    throw new Error(
      response && !response.ok
        ? response.error
        : "ジェムの同期に失敗しました。通信を確認してください。",
    );
  }
  if (!data || !data.ok || !Number.isSafeInteger(data.balance)) {
    throw new Error(
      data && !data.ok ? data.error : "残高を取得できませんでした。",
    );
  }
  return data.balance;
}

export function loadGemBalance(): Promise<number> {
  return walletAction({ action: "balance" });
}
export function verifyGemPurchase(transactionId: string): Promise<number> {
  return walletAction({ action: "verify", transactionId });
}
export function spendGems(
  reason: "hint" | "revive",
  actionId: string,
): Promise<number> {
  return walletAction({ action: "spend", reason, actionId });
}
