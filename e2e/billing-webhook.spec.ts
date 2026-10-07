import { expect, test } from "@playwright/test";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * The webhook is the only thing that changes a plan, so it's tested against real Stripe
 * test-mode objects. Stripe can't reach localhost, so the test signs the event itself with
 * the local webhook secret, exactly as Stripe would.
 */
test("a signed subscription event upgrades the plan once, duplicates and forgeries are rejected", async ({ request }) => {
  test.skip(!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"), "needs a Stripe test key");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });

  // A workspace with a Stripe customer, as startCheckout would create it.
  const email = `billing+${Date.now()}@relaydesk.test`;
  const { data: user } = await admin.auth.admin.createUser({ email, password: "e2e-Relaydesk-2026!", email_confirm: true });
  const slug = `billing-${Date.now()}`;
  const { data: ws } = await admin.from("workspaces").insert({ name: "Billing Test", slug, created_by: user.user!.id }).select("id").single();
  const customer = await stripe.customers.create({ email, payment_method: "pm_card_visa", invoice_settings: { default_payment_method: "pm_card_visa" } });
  await admin.from("subscriptions").insert({ workspace_id: ws!.id, stripe_customer_id: customer.id });

  // A real test-mode Pro subscription, paid with Stripe's test card.
  const [price] = (await stripe.prices.list({ lookup_keys: ["relaydesk_pro_monthly"], limit: 1 })).data;
  const sub = await stripe.subscriptions.create({ customer: customer.id, items: [{ price: price.id }] });
  expect(sub.status).toBe("active");

  const event = {
    id: `evt_test_${Date.now()}`,
    object: "event",
    type: "customer.subscription.updated",
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: sub.id, object: "subscription", customer: customer.id } },
  };
  const payload = JSON.stringify(event);
  const sign = (secret: string) => stripe.webhooks.generateTestHeaderString({ payload, secret });

  const first = await request.post("/api/stripe/webhook", {
    data: payload,
    headers: { "stripe-signature": sign(process.env.STRIPE_WEBHOOK_SECRET!), "content-type": "application/json" },
  });
  expect(first.status()).toBe(200);
  expect((await first.json()).result).toBe("applied");
  const { data: after } = await admin.from("workspaces").select("plan").eq("id", ws!.id).single();
  expect(after!.plan).toBe("pro");

  // Stripe retries: the same event must not be applied twice.
  const again = await request.post("/api/stripe/webhook", {
    data: payload,
    headers: { "stripe-signature": sign(process.env.STRIPE_WEBHOOK_SECRET!), "content-type": "application/json" },
  });
  expect((await again.json()).result).toBe("duplicate");
  const { data: logged } = await admin.from("stripe_events").select("deliveries").eq("id", event.id).single();
  expect(logged!.deliveries).toBe(2);

  // A forged signature is rejected before anything is read.
  const forged = await request.post("/api/stripe/webhook", {
    data: payload,
    headers: { "stripe-signature": sign("whsec_attacker"), "content-type": "application/json" },
  });
  expect(forged.status()).toBe(400);

  // Cancel in Stripe, deliver the cancellation: back to Free.
  await stripe.subscriptions.cancel(sub.id);
  const cancelEvent = JSON.stringify({ ...event, id: `${event.id}_cancel`, type: "customer.subscription.deleted" });
  const canceled = await request.post("/api/stripe/webhook", {
    data: cancelEvent,
    headers: { "stripe-signature": stripe.webhooks.generateTestHeaderString({ payload: cancelEvent, secret: process.env.STRIPE_WEBHOOK_SECRET! }), "content-type": "application/json" },
  });
  expect((await canceled.json()).result).toBe("applied");
  const { data: final } = await admin.from("workspaces").select("plan").eq("id", ws!.id).single();
  expect(final!.plan).toBe("free");

  await stripe.customers.del(customer.id);
});
