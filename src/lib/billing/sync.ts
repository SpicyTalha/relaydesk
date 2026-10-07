import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { planByLookupKey } from "@/lib/billing/plans";

// Paid statuses keep the paid plan. past_due keeps it during Stripe's retry window.
const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

/**
 * Writes a subscription's current state, as Stripe reports it, through apply_stripe_subscription():
 * the one database function that changes a plan, recording the source id so nothing applies twice.
 * Used by the webhook and by the pull-sync when someone comes back from Checkout or the portal.
 */
export async function applySubscription(sub: Stripe.Subscription, source: { id: string; type: string; created: Date }) {
  const item = sub.items.data[0];
  const plan = PAID_STATUSES.has(sub.status) ? (planByLookupKey(item?.price.lookup_key)?.id ?? "free") : "free";
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const { data, error } = await createAdminClient().rpc("apply_stripe_subscription", {
    p_event_id: source.id,
    p_event_type: source.type,
    p_event_created: source.created.toISOString(),
    p_customer: customer,
    p_subscription: sub.id,
    p_status: sub.status,
    p_plan: plan,
    p_lookup_key: item?.price.lookup_key ?? undefined,
    p_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : undefined,
    p_cancel_at_period_end: sub.cancel_at_period_end,
  });
  if (error) throw error;
  return data;
}

/**
 * Pull instead of waiting for a push: asks Stripe for this workspace's subscription right now and
 * applies it. Webhooks stay the main path; this makes the plan correct the moment someone returns
 * from Checkout or the portal, and heals any webhook that never arrived (local dev, an outage).
 */
export async function syncWorkspaceSubscription(workspaceId: string, reason: "checkout_return" | "portal_return") {
  const admin = createAdminClient();
  const { data: row } = await admin.from("subscriptions").select("stripe_customer_id").eq("workspace_id", workspaceId).maybeSingle();
  if (!row) return "no_customer";

  const { data: subs } = await stripe().subscriptions.list({
    customer: row.stripe_customer_id,
    status: "all",
    limit: 10,
    expand: ["data.items.data.price"],
  });
  // The live one if there is one; otherwise the most recent, so a cancellation shows up too.
  const sub = subs.find((s) => PAID_STATUSES.has(s.status)) ?? subs[0];
  if (!sub) return "no_subscription";

  const now = new Date();
  return applySubscription(sub, { id: `sync_${sub.id}_${now.getTime()}`, type: `sync.${reason}`, created: now });
}
