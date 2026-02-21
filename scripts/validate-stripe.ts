import "dotenv/config";
import Stripe from "stripe";

const detectMode = (key: string | undefined) => {
  if (!key) return "missing";
  if (key.startsWith("sk_test_") || key.startsWith("pk_test_")) return "test";
  if (key.startsWith("sk_live_") || key.startsWith("pk_live_")) return "live";
  return "unknown";
};

const summarizeBalance = (balance: Stripe.Balance) => {
  const available = balance.available.map((entry) => `${entry.amount} ${entry.currency.toUpperCase()}`).join(", ");
  const pending = balance.pending.map((entry) => `${entry.amount} ${entry.currency.toUpperCase()}`).join(", ");
  return {
    available: available || "none",
    pending: pending || "none",
  };
};

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLISHABLE_KEY;

  const secretMode = detectMode(secretKey);
  const publishableMode = detectMode(publishableKey);

  console.log("Stripe key check:");
  console.log(`- STRIPE_SECRET_KEY: ${secretMode}`);
  console.log(`- VITE_STRIPE_PUBLIC_KEY/STRIPE_PUBLISHABLE_KEY: ${publishableMode}`);

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não definida");
  }

  if (!publishableKey) {
    throw new Error("VITE_STRIPE_PUBLIC_KEY (ou STRIPE_PUBLISHABLE_KEY) não definida");
  }

  if (secretMode === "unknown" || publishableMode === "unknown") {
    throw new Error("Formato de chave Stripe inválido");
  }

  if (secretMode !== publishableMode) {
    throw new Error("As chaves pública e secreta estão em modos diferentes (test/live)");
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" as any });

  const account = await stripe.accounts.retrieve();
  console.log("Stripe account check:");
  console.log(`- account id: ${account.id}`);
  console.log(`- country: ${account.country || "n/a"}`);
  console.log(`- charges enabled: ${account.charges_enabled ? "yes" : "no"}`);
  console.log(`- payouts enabled: ${account.payouts_enabled ? "yes" : "no"}`);

  const balance = await stripe.balance.retrieve();
  const summarizedBalance = summarizeBalance(balance);
  console.log("Stripe balance check:");
  console.log(`- available: ${summarizedBalance.available}`);
  console.log(`- pending: ${summarizedBalance.pending}`);

  if (secretMode === "test") {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 50,
      currency: "brl",
      payment_method_types: ["card"],
      description: "VitaView Stripe integration validation",
      metadata: { source: "stripe-validation-script" },
    });
    console.log(`- test payment intent created: ${paymentIntent.id}`);

    await stripe.paymentIntents.cancel(paymentIntent.id);
    console.log("- test payment intent canceled successfully");
  } else {
    console.log("- live key detected: skipping create/cancel write test to avoid modifying production data");
  }
}

main().catch((error) => {
  console.error("Stripe validation failed:", error.message || error);
  process.exit(1);
});
