"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { CHECKOUT_INTEGRATION_ID, stripe } from "@/lib/stripe";
import { planById } from "@/lib/billing/plans";
import type { FormState } from "@/lib/form-state";

const ACTIVE = new Set(["active", "trialing", "past_due"]);

async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return `https://${(await headers()).get("host")}`;
}

/** The workspace's Stripe customer, created once and stored before any checkout starts. */
async function ensureCustomer(workspaceId: string, workspaceName: string, email: string): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (existing) return existing.stripe_customer_id;

  const customer = await stripe().customers.create({
    email,
    name: workspaceName,
    // Fallback reference only. Events are mapped through the customer id stored below.
    metadata: { workspace_id: workspaceId, app: "relaydesk" },
  });

  const { error } = await admin
    .from("subscriptions")
    .insert({ workspace_id: workspaceId, stripe_customer_id: customer.id });
  if (error) {
    // Two clicks raced and another request stored its customer first: use that one.
    await stripe().customers.del(customer.id);
    const { data: winner } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("workspace_id", workspaceId)
      .single();
    return winner!.stripe_customer_id;
  }
  return customer.id;
}

export async function startCheckout(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ slug: z.string().min(1), plan: z.enum(["pro", "studio"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choose a plan." };
  const { slug, plan } = parsed.data;

  const [ws, user] = await Promise.all([getWorkspaceContext(slug), getCurrentUser()]);
  if (!ws.isOwner || !user) return { error: "Only owners can change the plan." };

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("status").eq("workspace_id", ws.id).maybeSingle();
  if (sub && ACTIVE.has(sub.status)) {
    // Already subscribed: plan changes go through the portal, which prorates correctly.
    return openPortalFor(ws.id, slug);
  }

  let url: string | null;
  try {
    const customer = await ensureCustomer(ws.id, ws.name, user.email);
    const lookupKey = planById(plan).lookupKey!;
    const prices = await stripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    if (!prices.data[0]) return { error: "That plan isn't available right now." };

    const base = await origin();
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: ws.id,
      line_items: [{ price: prices.data[0].id, quantity: 1 }],
      // No payment_method_types: Stripe picks eligible methods dynamically.
      success_url: `${base}/w/${slug}/billing?checkout=success`,
      cancel_url: `${base}/w/${slug}/billing?checkout=canceled`,
      subscription_data: { metadata: { workspace_id: ws.id } },
      integration_identifier: CHECKOUT_INTEGRATION_ID,
    });
    url = session.url;
  } catch (err) {
    console.error("checkout failed", err);
    return { error: "We couldn't start checkout. Try again in a moment." };
  }
  if (!url) return { error: "We couldn't start checkout. Try again in a moment." };
  redirect(url);
}

async function openPortalFor(workspaceId: string, slug: string): Promise<FormState> {
  const admin = createAdminClient();
  const { data } = await admin.from("subscriptions").select("stripe_customer_id").eq("workspace_id", workspaceId).maybeSingle();
  if (!data) return { error: "There's no billing account yet. Choose a plan first." };

  let url: string;
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${await origin()}/w/${slug}/billing`,
      configuration: process.env.STRIPE_PORTAL_CONFIGURATION || undefined,
    });
    url = session.url;
  } catch (err) {
    console.error("portal failed", err);
    return { error: "We couldn't open billing. Try again in a moment." };
  }
  redirect(url);
}

export async function openPortal(_prev: FormState, formData: FormData): Promise<FormState> {
  const slug = String(formData.get("slug") ?? "");
  const ws = await getWorkspaceContext(slug);
  if (!ws.isOwner) return { error: "Only owners can manage billing." };
  return openPortalFor(ws.id, slug);
}
