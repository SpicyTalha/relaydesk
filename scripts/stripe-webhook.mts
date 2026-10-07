/**
 * Creates (or finds) the production webhook endpoint. Prints only the endpoint id;
 * the signing secret is written to stdout ONLY when --secret-only is passed, for piping into
 * `vercel env add`, so it never lands in logs.
 *   node --env-file=.env.local scripts/stripe-webhook.mts https://your-app/api/stripe/webhook --secret-only | vercel env add STRIPE_WEBHOOK_SECRET production
 */
import Stripe from "stripe";

const url = process.argv[2];
const secretOnly = process.argv.includes("--secret-only");
if (!url?.startsWith("https://")) throw new Error("Pass the https webhook URL.");
const key = process.env.STRIPE_SECRET_KEY!;
if (!key.startsWith("sk_test_")) throw new Error("Test mode keys only.");
const stripe = new Stripe(key);

// Only the events the handler acts on (Stripe recommends not subscribing to everything).
const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.dispute.created",
  "charge.refunded",
  "radar.early_fraud_warning.created",
];

const existing = (await stripe.webhookEndpoints.list({ limit: 100 })).data.find((e) => e.url === url);
if (existing) {
  // Stripe only reveals a secret at creation. Replace the endpoint to get a fresh one.
  await stripe.webhookEndpoints.del(existing.id);
}
const endpoint = await stripe.webhookEndpoints.create({ url, enabled_events: EVENTS, description: "Relaydesk (sample project)" });
if (secretOnly) process.stdout.write(endpoint.secret!);
else console.log(`Created ${endpoint.id} for ${url}`);
