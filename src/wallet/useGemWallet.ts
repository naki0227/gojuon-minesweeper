import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../online/client";
import { appleAuthorizationCode } from "./AppleAccount";
import {
  currentAppleAccount,
  deleteAppleAccount,
  isGemWalletConfigured,
  loadGemBalance,
  spendGems,
} from "./client";
import { gemStore } from "./gemStore";
import type { GemProduct } from "./gemStore.native";

export function useGemWallet() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [products, setProducts] = useState<GemProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isGemWalletConfigured || !gemStore.isSupported) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const account = await currentAppleAccount();
      setUserId(account);
      // Packs load even when the balance request fails, so the sheet can
      // still show what is for sale.
      if (account) {
        void gemStore
          .fetchProducts()
          .catch(() => [])
          .then(setProducts);
      }
      setBalance(account ? await loadGemBalance() : null);
    } catch {
      setBalance(null);
      setMessage("ジェム残高を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      void refresh();
    }, 0);
    if (!isGemWalletConfigured || !gemStore.isSupported) {
      return () => clearTimeout(initial);
    }
    const stopPurchaseListener = gemStore.subscribe((event) => {
      setBuying(false);
      if (event.type === "credited") {
        setBalance(event.balance);
        setMessage("購入したジェムを反映しました。");
      } else if (event.type === "pending") {
        setMessage("購入の承認待ちです。");
      } else {
        setMessage(event.message);
      }
    });
    const { data } = getSupabase().auth.onAuthStateChange(() => {
      // Run after the current authentication event finishes.
      setTimeout(() => {
        void refresh();
      }, 0);
    });
    return () => {
      clearTimeout(initial);
      stopPurchaseListener();
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  const purchase = async (productId: string) => {
    if (!userId || buying) return;
    setBuying(true);
    setMessage(null);
    try {
      await gemStore.buy(userId, productId);
    } catch {
      setBuying(false);
      setMessage("購入を開始できませんでした。");
    }
  };

  const spend = async (reason: "hint" | "revive", actionId: string) => {
    if (!userId || balance === null) {
      throw new Error("ジェムの使用にはAppleログインと残高同期が必要です。");
    }
    const updated = await spendGems(reason, actionId);
    setBalance(updated);
  };

  const deleteAccount = async () => {
    if (!userId) return;
    setMessage(null);
    try {
      // Without a code (e.g. the Apple sheet was closed) the account is
      // still deleted; only the Apple token revocation is skipped.
      const code = await appleAuthorizationCode().catch(() => null);
      await deleteAppleAccount(code);
      setUserId(null);
      setBalance(null);
      setMessage("アカウントとジェム残高を削除しました。");
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "アカウントを削除できませんでした。",
      );
    }
  };

  return {
    userId,
    balance,
    products,
    loading,
    buying,
    message,
    refresh,
    purchase,
    spend,
    deleteAccount,
    enabled: isGemWalletConfigured && gemStore.isSupported,
  };
}
