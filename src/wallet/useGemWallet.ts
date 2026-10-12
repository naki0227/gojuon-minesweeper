import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../online/client";
import {
  currentAppleAccount,
  isGemWalletConfigured,
  loadGemBalance,
  spendGems,
} from "./client";
import { gemStore } from "./gemStore";

export function useGemWallet() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [price, setPrice] = useState<string | null>(null);
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
      setBalance(account ? await loadGemBalance() : null);
      if (account) {
        const product = await gemStore.fetchProduct().catch(() => null);
        setPrice(product?.displayPrice ?? null);
      }
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

  const purchase = async () => {
    if (!userId || !price || buying) return;
    setBuying(true);
    setMessage(null);
    try {
      await gemStore.buy(userId);
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

  return {
    userId,
    balance,
    price,
    loading,
    buying,
    message,
    refresh,
    purchase,
    spend,
    enabled: isGemWalletConfigured && gemStore.isSupported,
  };
}
