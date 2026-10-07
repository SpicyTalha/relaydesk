import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { planById } from "@/lib/billing/plans";
import type { Plan } from "@/lib/data/workspace";

/**
 * Platform admins only. The role lives in app_metadata, which only the server can set, and
 * everyone else gets a plain 404 so the page doesn't even admit it exists.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isPlatformAdmin) notFound();
  return user;
}

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export type AdminStudio = {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  isDemo: boolean;
  suspendedAt: string | null;
  createdAt: string;
  people: number;
  clients: number;
  subscription: string | null;
};

/** Everything the admin page shows, read with the service role (RLS doesn't apply to it). */
export async function getAdminOverview({ includeDemo }: { includeDemo: boolean }) {
  await requireAdmin();
  const admin = createAdminClient();

  let studiosQuery = admin
    .from("workspaces")
    .select("id, name, slug, plan, is_demo, suspended_at, created_at, memberships(count), clients(count)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!includeDemo) studiosQuery = studiosQuery.eq("is_demo", false);

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [studios, subs, events, events24h, audit, demoCount] = await Promise.all([
    studiosQuery,
    admin.from("subscriptions").select("workspace_id, status, plan"),
    admin.from("stripe_events").select("id, type, received_at, deliveries, outcome, summary, workspace_id").order("received_at", { ascending: false }).limit(40),
    admin.from("stripe_events").select("deliveries").gte("received_at", dayAgo),
    admin.from("audit_log").select("id, action, metadata, created_at, actor_id, workspace_id").order("created_at", { ascending: false }).limit(40),
    admin.from("workspaces").select("id", { count: "exact", head: true }).eq("is_demo", true),
  ]);
  for (const r of [studios, subs, events, events24h, audit]) if (r.error) throw r.error;

  const subByWs = new Map(subs.data!.map((s) => [s.workspace_id, s]));
  const paying = subs.data!.filter((s) => ACTIVE.has(s.status) && s.plan !== "free");
  const names = new Map(studios.data!.map((w) => [w.id, w.name]));

  const actorIds = [...new Set(audit.data!.map((a) => a.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length ? await admin.from("profiles").select("id, full_name").in("id", actorIds) : { data: [] };

  return {
    stats: {
      studios: studios.data!.filter((w) => !w.is_demo).length,
      paying: paying.length,
      // Test-mode monthly recurring revenue: list price of every active paid subscription.
      mrr: paying.reduce((sum, s) => sum + planById(s.plan as Plan).price, 0),
      demoCopies: demoCount.count ?? 0,
      events24h: events24h.data!.length,
      duplicates24h: events24h.data!.reduce((n, e) => n + Math.max(0, e.deliveries - 1), 0),
    },
    studios: studios.data!.map(
      (w): AdminStudio => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        plan: w.plan as Plan,
        isDemo: w.is_demo,
        suspendedAt: w.suspended_at,
        createdAt: w.created_at,
        people: (w.memberships as unknown as { count: number }[])[0]?.count ?? 0,
        clients: (w.clients as unknown as { count: number }[])[0]?.count ?? 0,
        subscription: subByWs.get(w.id)?.status ?? null,
      }),
    ),
    events: events.data!.map((e) => ({ ...e, studio: e.workspace_id ? (names.get(e.workspace_id) ?? null) : null })),
    audit: audit.data!.map((a) => ({
      ...a,
      actor: actors?.find((p) => p.id === a.actor_id)?.full_name || "An admin",
      studio: a.workspace_id ? (names.get(a.workspace_id) ?? null) : null,
    })),
  };
}
