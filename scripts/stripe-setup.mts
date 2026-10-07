/**
 * Creates (or finds) the Relaydesk plans and the Customer Portal configuration in Stripe.
 * Safe to run repeatedly: plans are found by their price lookup keys.
 *
 *   node --env-file=.env.local scripts/stripe-setup.mts
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
  throw new Error("Refusing to run against a live Stripe key. This demo uses test mode only.");
}
const stripe = new Stripe(key);

const PLANS = [
  {
    lookupKey: "relaydesk_pro_monthly",
    name: "Relaydesk Pro",
    description: "15 client spaces, 10 team seats, 20 GB storage, AI revision checklists.",
    unitAmount: 2900,
  },
  {
    lookupKey: "relaydesk_studio_monthly",
    name: "Relaydesk Studio",
    description: "Unlimited client spaces and seats, 100 GB storage, more AI checklists.",
    unitAmount: 7900,
  },
] as const;

async function ensurePlan(plan: (typeof PLANS)[number]) {
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], expand: ["data.product"] });
  if (existing.data[0]) {
    const product = existing.data[0].product as Stripe.Product;
    console.log(`= ${plan.name}: ${existing.data[0].id} (product ${product.id})`);
    return { priceId: existing.data[0].id, productId: product.id };
  }
  // One Product per plan, so Checkout, invoices and the portal show the plan name.
  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { app: "relaydesk" },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: plan.unitAmount,
    recurring: { interval: "month" },
    lookup_key: plan.lookupKey,
    metadata: { app: "relaydesk" },
  });
  console.log(`+ ${plan.name}: ${price.id} (product ${product.id})`);
  return { priceId: price.id, productId: product.id };
}

async function ensurePortal(plans: { priceId: string; productId: string }[]) {
  const configs = await stripe.billingPortal.configurations.list({ limit: 100 });
  const found = configs.data.find((c) => c.metadata?.app === "relaydesk" && c.active);
  if (found) {
    console.log(`= Customer Portal configuration: ${found.id}`);
    return found.id;
  }
  const config = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Relaydesk (sample project, test mode)" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      customer_update: { enabled: true, allowed_updates: ["email", "name"] },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: plans.map((p) => ({ product: p.productId, prices: [p.priceId] })),
      },
    },
    metadata: { app: "relaydesk" },
  });
  console.log(`+ Customer Portal configuration: ${config.id}`);
  return config.id;
}

const plans = [];
for (const plan of PLANS) plans.push(await ensurePlan(plan));
const portal = await ensurePortal(plans);
console.log(`\nSet STRIPE_PORTAL_CONFIGURATION=${portal} in the environment.`);
