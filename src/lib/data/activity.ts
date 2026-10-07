import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type ActivityItem = {
  id: number;
  action: string;
  createdAt: string;
  actorName: string;
  actorId: string | null;
  clientId: string | null;
  clientName: string | null;
  deliverableId: string | null;
  deliverableTitle: string | null;
  metadata: Record<string, Json | undefined>;
};

/** Recent activity, already filtered by RLS (clients only receive client-visible events from their space). */
export async function getActivity(
  workspaceId: string,
  opts: { clientId?: string; deliverableId?: string; limit?: number; excludeActor?: string } = {},
): Promise<ActivityItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("activity")
    .select("id, action, metadata, created_at, actor_id, client_id, deliverable_id, client:clients(name), deliverable:deliverables(title)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 15);
  if (opts.clientId) query = query.eq("client_id", opts.clientId);
  if (opts.deliverableId) query = query.eq("deliverable_id", opts.deliverableId);
  // Nobody needs to be told about what they did themselves.
  if (opts.excludeActor) query = query.or(`actor_id.is.null,actor_id.neq.${opts.excludeActor}`);

  const { data, error } = await query;
  if (error) throw error;

  // actor_id points at auth.users, so names come from profiles in one extra query.
  const actorIds = [...new Set(data.map((a) => a.actor_id).filter((id): id is string => !!id))];
  const { data: profiles } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return data.map((a) => ({
    id: a.id,
    action: a.action,
    createdAt: a.created_at,
    actorName: (a.actor_id && names.get(a.actor_id)) || "Someone",
    actorId: a.actor_id,
    clientId: a.client_id,
    clientName: a.client?.name ?? null,
    deliverableId: a.deliverable_id,
    deliverableTitle: a.deliverable?.title ?? null,
    metadata: (a.metadata ?? {}) as Record<string, Json | undefined>,
  }));
}
