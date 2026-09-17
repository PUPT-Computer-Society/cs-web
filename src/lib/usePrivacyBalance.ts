import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cs_show_finance_balance";
const BALANCE_EVENT = "cs-finance-balance-toggle";

/**
 * Hook to manage masked/unmasked privacy toggle for financial balances.
 * Defaults to masked (hidden: true) to prevent public shoulder surfing.
 */
export function usePrivacyBalance() {
  const [showBalance, setShowBalance] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    const handleSync = () => {
      setShowBalance(localStorage.getItem(STORAGE_KEY) === "true");
    };

    window.addEventListener(BALANCE_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(BALANCE_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const toggleShowBalance = useCallback(() => {
    setShowBalance((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      window.dispatchEvent(new Event(BALANCE_EVENT));
      return next;
    });
  }, []);

  return { showBalance, toggleShowBalance };
}
