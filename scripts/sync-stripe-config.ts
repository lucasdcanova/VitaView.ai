import "dotenv/config";
import Stripe from "stripe";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

type Plan = {
  id: number;
  name: string;
  description: string;
  interval: "month" | "6month" | "year";
  price: number;
  trialPeriodDays: number;
};

type ProductFamily = {
  key: "vita_pro" | "vita_team" | "vita_business" | "hospitais";
  productName: "Vita Pro" | "Vita Team" | "Vita Business" | "Hospitais";
};

const WEBHOOK_EVENTS = [
  "payment_intent.succeeded",
  "setup_intent.succeeded",
  "invoice.payment_succeeded",
  "customer.subscription.deleted",
] as const;

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} não definida`);
  }
  return value;
};

const familyForPlan = (planName: string): ProductFamily => {
  const normalized = planName.toLowerCase();
  if (normalized.startsWith("vita pro")) {
    return { key: "vita_pro", productName: "Vita Pro" };
  }
  if (normalized.startsWith("vita team")) {
    return { key: "vita_team", productName: "Vita Team" };
  }
  if (normalized.startsWith("vita business")) {
    return { key: "vita_business", productName: "Vita Business" };
  }
  if (normalized === "hospitais") {
    return { key: "hospitais", productName: "Hospitais" };
  }
  throw new Error(`Plano inesperado: ${planName}`);
};

const recurringForInterval = (interval: Plan["interval"]) => {
  if (interval === "month") {
    return { interval: "month" as const, intervalCount: 1 };
  }
  if (interval === "6month") {
    return { interval: "month" as const, intervalCount: 6 };
  }
  return { interval: "year" as const, intervalCount: 1 };
};

async function main() {
  const databaseUrl = getRequiredEnv("DATABASE_URL");
  const stripeSecretKey = getRequiredEnv("STRIPE_SECRET_KEY");
  const appUrl = getRequiredEnv("APP_URL").replace(/\/$/, "");
  const webhookUrl = `${appUrl}/api/webhook`;

  const stripe = new Stripe(stripeSecretKey);
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const planQuery = await pool.query<Plan>(`
      select
        id,
        name,
        description,
        interval,
        price,
        coalesce(trial_period_days, 0) as "trialPeriodDays"
      from subscription_plans
      where is_active = true and price > 0
      order by id
    `);

    const plans = planQuery.rows;
    if (plans.length === 0) {
      throw new Error("Nenhum plano pago ativo encontrado");
    }

    const productDescriptions = new Map<ProductFamily["key"], string>();
    for (const plan of plans) {
      const family = familyForPlan(plan.name);
      if (!productDescriptions.has(family.key) || plan.interval === "month") {
        productDescriptions.set(family.key, plan.description);
      }
    }

    const existingProducts = new Map<string, Stripe.Product>();
    for await (const product of stripe.products.list({ active: true, limit: 100 })) {
      if (product.metadata.app === "vitaview" && product.metadata.family) {
        existingProducts.set(product.metadata.family, product);
      }
    }

    const productsByFamily = new Map<ProductFamily["key"], Stripe.Product>();
    const productActions: Array<{ family: string; action: string; productId: string }> = [];

    const families: ProductFamily[] = [
      { key: "vita_pro", productName: "Vita Pro" },
      { key: "vita_team", productName: "Vita Team" },
      { key: "vita_business", productName: "Vita Business" },
      { key: "hospitais", productName: "Hospitais" },
    ];

    for (const family of families) {
      const existing = existingProducts.get(family.key);
      if (existing) {
        productsByFamily.set(family.key, existing);
        productActions.push({ family: family.key, action: "reused", productId: existing.id });
        continue;
      }

      const created = await stripe.products.create({
        name: family.productName,
        description: productDescriptions.get(family.key) ?? family.productName,
        type: "service",
        metadata: {
          app: "vitaview",
          family: family.key,
          product_name: family.productName,
        },
      });

      productsByFamily.set(family.key, created);
      productActions.push({ family: family.key, action: "created", productId: created.id });
    }

    const priceActions: Array<{ planId: number; planName: string; action: string; priceId: string }> = [];
    const selectedPriceIds = new Map<number, string>();

    for (const plan of plans) {
      const family = familyForPlan(plan.name);
      const product = productsByFamily.get(family.key);
      if (!product) {
        throw new Error(`Produto ausente para ${plan.name}`);
      }

      const { interval, intervalCount } = recurringForInterval(plan.interval);
      const lookupKey = `vitaview_${family.key}_${plan.interval}`;
      const existingPrices = await stripe.prices.list({
        active: true,
        lookup_keys: [lookupKey],
        limit: 10,
      });

      const matchingPrice = existingPrices.data.find((price) => {
        const recurring = price.recurring;
        return (
          price.product === product.id &&
          price.currency === "brl" &&
          price.unit_amount === plan.price &&
          recurring?.interval === interval &&
          (recurring?.interval_count ?? 1) === intervalCount
        );
      });

      if (matchingPrice) {
        selectedPriceIds.set(plan.id, matchingPrice.id);
        priceActions.push({
          planId: plan.id,
          planName: plan.name,
          action: "reused",
          priceId: matchingPrice.id,
        });
        continue;
      }

      const created = await stripe.prices.create({
        product: product.id,
        currency: "brl",
        unit_amount: plan.price,
        recurring: {
          interval,
          interval_count: intervalCount,
        },
        lookup_key: lookupKey,
        metadata: {
          app: "vitaview",
          family: family.key,
          plan_id: String(plan.id),
          plan_name: plan.name,
          interval: plan.interval,
          product_name: family.productName,
        },
      });

      selectedPriceIds.set(plan.id, created.id);
      priceActions.push({
        planId: plan.id,
        planName: plan.name,
        action: "created",
        priceId: created.id,
      });
    }

    for (const [planId, priceId] of selectedPriceIds) {
      await pool.query(
        "update subscription_plans set stripe_price_id = $1 where id = $2",
        [priceId, planId],
      );
    }

    for (const plan of plans.filter((item) => item.interval === "month")) {
      const family = familyForPlan(plan.name);
      const product = productsByFamily.get(family.key);
      const defaultPriceId = selectedPriceIds.get(plan.id);
      if (product && defaultPriceId && product.default_price !== defaultPriceId) {
        await stripe.products.update(product.id, { default_price: defaultPriceId });
      }
    }

    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const existingWebhook = existingWebhooks.data.find((item) => item.url === webhookUrl);

    let webhookId: string;
    let webhookSecret: string | null = null;
    let webhookAction: "created" | "updated" | "reused";

    if (existingWebhook) {
      const hasExactEvents =
        existingWebhook.enabled_events.length === WEBHOOK_EVENTS.length &&
        existingWebhook.enabled_events.every((event) => WEBHOOK_EVENTS.includes(event as typeof WEBHOOK_EVENTS[number]));

      if (hasExactEvents) {
        webhookId = existingWebhook.id;
        webhookAction = "reused";
      } else {
        const updated = await stripe.webhookEndpoints.update(existingWebhook.id, {
          enabled_events: [...WEBHOOK_EVENTS],
        });
        webhookId = updated.id;
        webhookAction = "updated";
      }
    } else {
      const created = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [...WEBHOOK_EVENTS],
        description: "VitaView production billing webhook",
        metadata: {
          app: "vitaview",
        },
      });
      webhookId = created.id;
      webhookSecret = created.secret;
      webhookAction = "created";
    }

    console.log(JSON.stringify({
      products: productActions,
      prices: priceActions,
      webhook: {
        action: webhookAction,
        id: webhookId,
        url: webhookUrl,
        secretCreated: Boolean(webhookSecret),
      },
      planPriceIds: Object.fromEntries(selectedPriceIds),
      createdWebhookSecret: webhookSecret,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Stripe sync failed:", error.message || error);
  process.exit(1);
});
