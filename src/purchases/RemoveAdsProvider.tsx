import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import { removeAdsStore } from "./removeAdsStore";
import type { RemoveAdsProduct } from "./types";

// "checking": the store has not answered yet (ads stay hidden meanwhile so a
// buyer never sees an ad flash on launch).
// "ready": the store answered. "unavailable": no store on this platform/build.
export type RemoveAdsStatus = "checking" | "ready" | "unavailable";

type RemoveAdsContextValue = {
  status: RemoveAdsStatus;
  owned: boolean;
  product: RemoveAdsProduct | null;
  busy: boolean;
  message: string | null;
  canPurchase: boolean;
  canRedeemCode: boolean;
  purchase: () => void;
  restore: () => void;
  redeemCode: () => void;
};

const RemoveAdsContext = createContext<RemoveAdsContextValue | null>(null);

export function RemoveAdsProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RemoveAdsStatus>(
    removeAdsStore.isSupported ? "checking" : "unavailable",
  );
  const [owned, setOwned] = useState(false);
  const [product, setProduct] = useState<RemoveAdsProduct | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!removeAdsStore.isSupported) {
      return;
    }

    let active = true;
    const unsubscribe = removeAdsStore.subscribe((event) => {
      if (event.type === "owned") {
        setOwned(true);
        setBusy(false);
        setMessage("広告を非表示にしました。");
      } else if (event.type === "pending") {
        setBusy(false);
        setMessage("購入の承認待ちです。承認されると広告が非表示になります。");
      } else {
        setBusy(false);
        setMessage(event.cancelled ? null : "購入を完了できませんでした。");
      }
    });

    let checkInFlight = false;
    let connected = false;
    const checkStore = async () => {
      if (checkInFlight) {
        return;
      }
      checkInFlight = true;
      // Only the first check (or a retry after a failure) hides ads while
      // waiting. Foreground re-checks keep the current answer so the banner
      // is not torn down and reloaded on every resume.
      setStatus((previous) => (previous === "ready" ? previous : "checking"));
      try {
        if (!connected) {
          await removeAdsStore.connect();
          connected = true;
        }
        const [ownsNow, fetched] = await Promise.all([
          removeAdsStore.ownsRemoveAds(),
          removeAdsStore.fetchProduct().catch(() => null),
        ]);
        if (!active) {
          return;
        }
        setOwned((previous) => previous || ownsNow);
        setProduct((previous) => fetched ?? previous);
        setStatus("ready");
      } catch {
        if (active) {
          setStatus((previous) =>
            previous === "ready" ? previous : "unavailable",
          );
        }
      } finally {
        checkInFlight = false;
      }
    };

    void checkStore();

    // Offer codes redeemed in the App Store app (or via the sheet) are picked
    // up when the user comes back.
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void checkStore();
      }
    });

    return () => {
      active = false;
      unsubscribe();
      appState.remove();
      void removeAdsStore.disconnect().catch(() => {});
    };
  }, []);

  const purchase = useCallback(() => {
    setBusy(true);
    setMessage(null);
    removeAdsStore.purchase().catch(() => {
      setBusy(false);
      setMessage("購入を開始できませんでした。");
    });
  }, []);

  const restore = useCallback(() => {
    setBusy(true);
    setMessage(null);
    removeAdsStore
      .restore()
      .then((restored) => {
        if (restored) {
          setOwned(true);
        }
        setMessage(
          restored
            ? "購入を復元しました。"
            : "復元できる購入が見つかりませんでした。",
        );
      })
      .catch(() => setMessage("購入を復元できませんでした。"))
      .finally(() => setBusy(false));
  }, []);

  const redeemCode = useCallback(() => {
    setMessage(null);
    removeAdsStore.redeemCode().catch(() => {
      setMessage("コード入力画面を開けませんでした。");
    });
  }, []);

  const value = useMemo<RemoveAdsContextValue>(
    () => ({
      status,
      owned,
      product,
      busy,
      message,
      canPurchase: status === "ready" && product !== null,
      canRedeemCode: status === "ready" && removeAdsStore.canRedeemCode,
      purchase,
      restore,
      redeemCode,
    }),
    [busy, message, owned, product, purchase, redeemCode, restore, status],
  );

  return (
    <RemoveAdsContext.Provider value={value}>
      {children}
    </RemoveAdsContext.Provider>
  );
}

export function useRemoveAds(): RemoveAdsContextValue {
  const value = useContext(RemoveAdsContext);
  if (!value) {
    throw new Error("useRemoveAds must be used inside RemoveAdsProvider");
  }
  return value;
}
