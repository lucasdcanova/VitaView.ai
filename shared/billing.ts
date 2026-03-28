export type BillingPlatform = "web" | "ios";
export type BillingProvider = "stripe" | "app_store";

export interface BillingContext {
  platform: BillingPlatform;
  provider: BillingProvider;
  checkoutEnabled: boolean;
  priceMarkupPercent: number;
  checkoutMessage: string | null;
}

export const IOS_APP_STORE_PRICE_MARKUP_PERCENT = 30;

export const normalizeBillingPlatform = (
  platform?: string | null
): BillingPlatform => {
  if (platform?.toLowerCase() === "ios") {
    return "ios";
  }

  return "web";
};

export const getBillingProviderForPlatform = (
  platform: BillingPlatform
): BillingProvider => (platform === "ios" ? "app_store" : "stripe");

export const applyPlatformPriceAdjustment = (
  amount: number | null | undefined,
  platform: BillingPlatform
) => {
  if (typeof amount !== "number") {
    return amount ?? null;
  }

  if (amount <= 0 || platform !== "ios") {
    return amount;
  }

  return Math.round(amount * (1 + IOS_APP_STORE_PRICE_MARKUP_PERCENT / 100));
};
