import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { applySubscription } from "@/lib/billing/sync";

/**
 * Stripe webhook: the main path that changes a workspace's plan (lib/billing/sync.ts also pulls
 * the current state from Stripe when someone returns from Checkout or the portal).
 *
 * 1. Verify the signature against the raw body (never parse JSON first).
 * 2. Re-fetch the subscription from Stripe instead of trusting the event payload, so events
 *    that arrive late or out of order still converge on the current state.
 * 3. apply_stripe_subscription() records the event id and applies the change in one database
 *    transaction, so a redelivered event is detected and never applied twice.
 */

const SUBSCRIPTION_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);
const RISK_EVENTS = new Set(["charge.dispute.created", "charge.refunded", "radar.early_fraud_warning.created"]);

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const result = SUBSCRIPTION_EVENTS.has(event.type)
      ? await handleSubscriptionEvent(event)
      : RISK_EVENTS.has(event.type)
        ? await handleRiskEvent(event)
        : await record(event, "ignored", "Not handled");
    return Response.json({ received: true, result });
  } catch (err) {
    // A 500 makes Stripe retry with backoff. Signature errors above return 400 and are not retried.
    console.error("stripe webhook failed", event.type, event.id, err);
    return new Response("Webhook handler failed", { status: 500 });
  }
}

function subscriptionIdOf(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>;
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      return session.mode === "subscription" ? (typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null)) : null;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = invoice.parent?.subscription_details?.subscription;
      return typeof sub === "string" ? sub : (sub?.id ?? null);
    }
    default:
      return typeof obj.id === "string" ? obj.id : null;
  }
}

async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscriptionId = subscriptionIdOf(event);
  if (!subscriptionId) return record(event, "ignored", "No subscription on this event");

  const sub = await stripe().subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] });
  return applySubscription(sub, { id: event.id, type: event.type, created: new Date(event.created * 1000) });
}

async function handleRiskEvent(event: Stripe.Event) {
  const obj = event.data.object as unknown as { customer?: string | { id: string } | null; charge?: string | { id: string } | null };
  let customer = typeof obj.customer === "string" ? obj.customer : (obj.customer?.id ?? null);
  // Disputes and fraud warnings point at a charge; follow it to the customer.
  if (!customer && obj.charge) {
    const charge = await stripe().charges.retrieve(typeof obj.charge === "string" ? obj.charge : obj.charge.id);
    customer = typeof charge.customer === "string" ? charge.customer : (charge.customer?.id ?? null);
  }
  const note =
    event.type === "charge.dispute.created"
      ? "A payment was disputed. Review it in Stripe."
      : event.type === "charge.refunded"
        ? "A payment was refunded."
        : "Stripe flagged a payment as possible fraud.";

  if (!customer) return record(event, "recorded", note);
  const { data, error } = await createAdminClient().rpc("flag_stripe_risk", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_event_created: new Date(event.created * 1000).toISOString(),
    p_customer: customer,
    p_note: note,
  });
  if (error) throw error;
  return data;
}

async function record(event: Stripe.Event, outcome: "recorded" | "ignored", summary: string) {
  const { data, error } = await createAdminClient().rpc("record_stripe_event", {
    p_event_id: event.id,
    p_type: event.type,
    p_created: new Date(event.created * 1000).toISOString(),
    p_outcome: outcome,
    p_summary: summary,
  });
  if (error) throw error;
  return data ? outcome : "duplicate";
}
