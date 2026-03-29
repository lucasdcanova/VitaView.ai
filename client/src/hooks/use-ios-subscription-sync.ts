import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isNativeIOSApp } from "@/lib/app-shell";
import { StoreKit, type StoreKitTransaction } from "@/lib/storekit";
import { useAuth } from "@/hooks/use-auth";

const syncTransactionWithBackend = async (transaction: StoreKitTransaction) => {
  await apiRequest("POST", "/api/app-store/sync-subscription", {
    transactionId: transaction.transactionId,
    signedTransactionInfo: transaction.signedTransactionInfo,
  });
};

export const useIOSSubscriptionSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !isNativeIOSApp()) {
      return;
    }

    let cancelled = false;
    const syncActiveEntitlements = async () => {
      try {
        const { transactions } = await StoreKit.syncCurrentEntitlements();
        for (const transaction of transactions) {
          if (cancelled) return;
          await syncTransactionWithBackend(transaction);
        }

        if (!cancelled) {
          await queryClient.invalidateQueries({ queryKey: ["/api/user-subscription"] });
          await queryClient.invalidateQueries({ queryKey: ["/api/subscription/limits"] });
        }
      } catch (error) {
        console.error("[StoreKit] Failed to sync current entitlements", error);
      }
    };

    void syncActiveEntitlements();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncActiveEntitlements();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient, user]);
};
