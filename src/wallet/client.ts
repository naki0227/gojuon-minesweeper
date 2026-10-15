import { LOCALE, tr } from "../i18n";
import { getSupabase, isOnlineConfigured } from "../online/client";

const S = tr({
  ja: {
    syncFailed: "ジェムの同期に失敗しました。通信を確認してください。",
    noBalance: "残高を取得できませんでした。",
    deleteFailed: "アカウントを削除できませんでした。通信を確認してください。",
  },
  en: {
    syncFailed: "Couldn't sync your gems. Check your connection.",
    noBalance: "Couldn't load your gem balance.",
    deleteFailed: "Couldn't delete your account. Check your connection.",
  },
});

// English for the gem-wallet server's Japanese error messages.
const SERVER_ERRORS_EN: Readonly<Record<string, string>> = {
  "Appleログインが必要です。": "Please sign in with Apple.",
  "Appleでログインしてください。": "Please sign in with Apple.",
  "消費内容が正しくありません。": "Invalid gem request.",
  "ジェムが足りません。": "Not enough gems.",
  "購入情報が正しくありません。": "Invalid purchase info.",
  "このApple購入はこのアカウントに付与できません。":
    "This Apple purchase can't be added to this account.",
  "購入の検証環境が不明です。": "Couldn't verify the purchase environment.",
  "購入情報をAppleに確認できませんでした。":
    "Couldn't verify the purchase with Apple.",
  "不明な操作です。": "Unknown request.",
  "処理できませんでした。後ほど再試行してください。":
    "Something went wrong. Please try again later.",
};

function serverError(message: string): string {
  if (LOCALE === "ja") return message;
  return (
    SERVER_ERRORS_EN[message] ?? "Something went wrong. Please try again later."
  );
}

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
      response && !response.ok ? serverError(response.error) : S.syncFailed,
    );
  }
  if (!data || !data.ok || !Number.isSafeInteger(data.balance)) {
    throw new Error(data && !data.ok ? serverError(data.error) : S.noBalance);
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

// Deletes the Apple account's wallet and server account. Remaining gems are
// lost; Apple purchase records stay without the account to stop reuse.
export async function deleteAppleAccount(
  authorizationCode: string | null,
): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke<
    { ok: true } | { ok: false; error: string }
  >("gem-wallet", {
    body: {
      action: "delete_account",
      authorizationCode: authorizationCode ?? "",
    },
  });
  if (error || !data?.ok) {
    throw new Error(S.deleteFailed);
  }
  // The server already removed the user; only the local session is left.
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
}
