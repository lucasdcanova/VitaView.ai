export type AppStoreEnvironment = "sandbox" | "production";

export type AppStoreTransactionPayload = {
  transactionId: string;
  originalTransactionId?: string;
  webOrderLineItemId?: string;
  bundleId?: string;
  productId: string;
  appAccountToken?: string;
  purchaseDate?: number;
  originalPurchaseDate?: number;
  expiresDate?: number;
  revocationDate?: number;
  revocationReason?: number;
  signedDate?: number;
  environment?: string;
  type?: string;
  inAppOwnershipType?: string;
};

export type AppStorePlanTier =
  | "free"
  | "pro"
  | "team"
  | "business"
  | "hospitais";

const APP_STORE_PLAN_PRIORITY: Record<AppStorePlanTier, number> = {
  free: 0,
  pro: 1,
  team: 2,
  business: 3,
  hospitais: 4,
};

export const normalizeAppStoreEnvironment = (
  value?: string | null
): AppStoreEnvironment => {
  const normalized = value?.toLowerCase() ?? "";
  return normalized.includes("sandbox") || normalized.includes("xcode")
    ? "sandbox"
    : "production";
};

export const decodeSignedPayload = <T>(signedPayload: string): T => {
  const payloadSegment = signedPayload.split(".")[1];
  if (!payloadSegment) {
    throw new Error("signed payload inválido");
  }

  return JSON.parse(
    Buffer.from(payloadSegment, "base64url").toString("utf8")
  ) as T;
};

export const buildStableAppAccountToken = (userId: number) => {
  const hexUserId = userId.toString(16).padStart(12, "0").slice(-12);
  return `00000000-0000-4000-8000-${hexUserId}`;
};

export const extractUserIdFromAppAccountToken = (
  appAccountToken?: string | null
) => {
  if (!appAccountToken) {
    return null;
  }

  const compact = appAccountToken.replace(/-/g, "");
  if (compact.length !== 32) {
    return null;
  }

  const encodedUserId = compact.slice(-12);
  const parsedUserId = Number.parseInt(encodedUserId, 16);
  return Number.isInteger(parsedUserId) ? parsedUserId : null;
};

export const resolveAppStorePlanTier = (
  appleProductId?: string | null,
  planName?: string | null
): AppStorePlanTier => {
  const productId = appleProductId?.toLowerCase() ?? "";
  if (productId.includes(".vita_pro.")) return "pro";
  if (productId.includes(".vita_team.")) return "team";
  if (productId.includes(".vita_business.")) return "business";
  if (productId.includes(".hospitais.")) return "hospitais";

  const normalizedPlanName = planName?.toLowerCase() ?? "";
  if (normalizedPlanName.includes("hospitais")) return "hospitais";
  if (normalizedPlanName.includes("business")) return "business";
  if (normalizedPlanName.includes("team")) return "team";
  if (normalizedPlanName.includes("pro")) return "pro";
  if (
    normalizedPlanName.includes("profissional de saúde") ||
    normalizedPlanName.includes("profissional de saude")
  ) {
    return "pro";
  }

  return "free";
};

export const compareAppStorePlanTier = (
  left: AppStorePlanTier,
  right: AppStorePlanTier
) => APP_STORE_PLAN_PRIORITY[left] - APP_STORE_PLAN_PRIORITY[right];

export const shouldReplaceAppStoreSubscription = ({
  existingAppleProductId,
  existingPlanName,
  existingOriginalTransactionId,
  existingStatus,
  existingCurrentPeriodEnd,
  incomingAppleProductId,
  incomingPlanName,
  incomingOriginalTransactionId,
  incomingCurrentPeriodEnd,
  now = Date.now(),
}: {
  existingAppleProductId?: string | null;
  existingPlanName?: string | null;
  existingOriginalTransactionId?: string | null;
  existingStatus?: string | null;
  existingCurrentPeriodEnd?: Date | string | null;
  incomingAppleProductId?: string | null;
  incomingPlanName?: string | null;
  incomingOriginalTransactionId?: string | null;
  incomingCurrentPeriodEnd?: Date | string | null;
  now?: number;
}) => {
  if (!existingOriginalTransactionId || !incomingOriginalTransactionId) {
    return true;
  }

  if (existingOriginalTransactionId === incomingOriginalTransactionId) {
    return true;
  }

  if (existingStatus !== "active") {
    return true;
  }

  const existingEndsAt = existingCurrentPeriodEnd
    ? new Date(existingCurrentPeriodEnd).getTime()
    : 0;
  if (existingEndsAt <= now) {
    return true;
  }

  const existingTier = resolveAppStorePlanTier(
    existingAppleProductId,
    existingPlanName
  );
  const incomingTier = resolveAppStorePlanTier(
    incomingAppleProductId,
    incomingPlanName
  );
  const tierComparison = compareAppStorePlanTier(incomingTier, existingTier);

  if (tierComparison > 0) {
    return true;
  }

  if (tierComparison < 0) {
    return false;
  }

  const incomingEndsAt = incomingCurrentPeriodEnd
    ? new Date(incomingCurrentPeriodEnd).getTime()
    : 0;
  return incomingEndsAt >= existingEndsAt;
};
