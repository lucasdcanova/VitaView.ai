import { registerPlugin } from "@capacitor/core";
import { buildStableAppAccountToken } from "@shared/app-store";
export { buildStableAppAccountToken } from "@shared/app-store";

export interface StoreKitProduct {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string;
  type: string;
  subscriptionPeriodUnit?: string;
  subscriptionPeriodValue?: number;
}

export interface StoreKitTransaction {
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  purchaseDate?: string;
  expirationDate?: string;
  revocationDate?: string;
  signedTransactionInfo: string;
}

export interface StoreKitPlugin {
  getProducts(options: {
    productIds: string[];
  }): Promise<{ products: StoreKitProduct[] }>;
  purchase(options: {
    productId: string;
    appAccountToken?: string;
  }): Promise<{
    status: "purchased" | "pending" | "cancelled" | "unknown";
    transaction?: StoreKitTransaction;
  }>;
  restorePurchases(): Promise<{ transactions: StoreKitTransaction[] }>;
  syncCurrentEntitlements(): Promise<{ transactions: StoreKitTransaction[] }>;
  presentManageSubscriptions(): Promise<void>;
  presentPaywall(options?: { appAccountToken?: string }): Promise<void>;
  addListener(
    eventName: "transactionUpdate",
    listenerFunc: (event: { transaction: StoreKitTransaction }) => void
  ): Promise<{ remove: () => Promise<void> }>;
  addListener(
    eventName: "transactionUpdateError",
    listenerFunc: (event: { message: string }) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

export const StoreKit = registerPlugin<StoreKitPlugin>("StoreKit");
