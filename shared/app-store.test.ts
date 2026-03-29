import { describe, expect, it } from "vitest";
import {
  buildStableAppAccountToken,
  compareAppStorePlanTier,
  decodeSignedPayload,
  extractUserIdFromAppAccountToken,
  normalizeAppStoreEnvironment,
  resolveAppStorePlanTier,
  shouldReplaceAppStoreSubscription,
} from "./app-store";

describe("app-store utils", () => {
  it("round-trips appAccountToken to userId", () => {
    const token = buildStableAppAccountToken(123456);
    expect(token).toBe("00000000-0000-4000-8000-00000001e240");
    expect(extractUserIdFromAppAccountToken(token)).toBe(123456);
  });

  it("normalizes sandbox-like environments", () => {
    expect(normalizeAppStoreEnvironment("Sandbox")).toBe("sandbox");
    expect(normalizeAppStoreEnvironment("Xcode")).toBe("sandbox");
    expect(normalizeAppStoreEnvironment("Production")).toBe("production");
    expect(normalizeAppStoreEnvironment(undefined)).toBe("production");
  });

  it("decodes signed payload body", () => {
    const body = { productId: "br.com.lucascanova.vitaview.vita_pro.monthly" };
    const signedPayload = `header.${Buffer.from(
      JSON.stringify(body)
    ).toString("base64url")}.signature`;

    expect(decodeSignedPayload<typeof body>(signedPayload)).toEqual(body);
  });

  it("maps product ids to internal plan tiers", () => {
    expect(
      resolveAppStorePlanTier(
        "br.com.lucascanova.vitaview.vita_pro.monthly",
        null
      )
    ).toBe("pro");
    expect(
      resolveAppStorePlanTier(
        "br.com.lucascanova.vitaview.vita_team.annual",
        null
      )
    ).toBe("team");
    expect(
      resolveAppStorePlanTier(
        "br.com.lucascanova.vitaview.vita_business.annual",
        null
      )
    ).toBe("business");
    expect(
      resolveAppStorePlanTier(
        "br.com.lucascanova.vitaview.hospitais.monthly",
        null
      )
    ).toBe("hospitais");
    expect(resolveAppStorePlanTier(null, "Profissional de Saúde")).toBe("pro");
  });

  it("compares plan priority correctly", () => {
    expect(compareAppStorePlanTier("team", "pro")).toBeGreaterThan(0);
    expect(compareAppStorePlanTier("pro", "business")).toBeLessThan(0);
    expect(compareAppStorePlanTier("hospitais", "hospitais")).toBe(0);
  });

  it("does not replace an active higher-tier app store subscription with a lower one", () => {
    const shouldReplace = shouldReplaceAppStoreSubscription({
      existingAppleProductId: "br.com.lucascanova.vitaview.vita_team.monthly",
      existingPlanName: "Vita Team",
      existingOriginalTransactionId: "orig-team",
      existingStatus: "active",
      existingCurrentPeriodEnd: "2026-04-30T00:00:00.000Z",
      incomingAppleProductId: "br.com.lucascanova.vitaview.vita_pro.monthly",
      incomingPlanName: "Vita Pro",
      incomingOriginalTransactionId: "orig-pro",
      incomingCurrentPeriodEnd: "2026-04-15T00:00:00.000Z",
      now: new Date("2026-03-29T00:00:00.000Z").getTime(),
    });

    expect(shouldReplace).toBe(false);
  });

  it("replaces when the incoming app store subscription is higher tier", () => {
    const shouldReplace = shouldReplaceAppStoreSubscription({
      existingAppleProductId: "br.com.lucascanova.vitaview.vita_pro.monthly",
      existingPlanName: "Vita Pro",
      existingOriginalTransactionId: "orig-pro",
      existingStatus: "active",
      existingCurrentPeriodEnd: "2026-04-15T00:00:00.000Z",
      incomingAppleProductId: "br.com.lucascanova.vitaview.vita_team.monthly",
      incomingPlanName: "Vita Team",
      incomingOriginalTransactionId: "orig-team",
      incomingCurrentPeriodEnd: "2026-04-30T00:00:00.000Z",
      now: new Date("2026-03-29T00:00:00.000Z").getTime(),
    });

    expect(shouldReplace).toBe(true);
  });

  it("keeps the newest entitlement when plan tier is the same", () => {
    expect(
      shouldReplaceAppStoreSubscription({
        existingAppleProductId: "br.com.lucascanova.vitaview.vita_pro.monthly",
        existingPlanName: "Vita Pro",
        existingOriginalTransactionId: "orig-pro-a",
        existingStatus: "active",
        existingCurrentPeriodEnd: "2026-04-15T00:00:00.000Z",
        incomingAppleProductId: "br.com.lucascanova.vitaview.vita_pro.annual",
        incomingPlanName: "Vita Pro Anual",
        incomingOriginalTransactionId: "orig-pro-b",
        incomingCurrentPeriodEnd: "2027-03-29T00:00:00.000Z",
        now: new Date("2026-03-29T00:00:00.000Z").getTime(),
      })
    ).toBe(true);
  });
});
