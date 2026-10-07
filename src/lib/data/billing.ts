import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getBilling(workspaceId: string) {
  const supabase = await createClient();
  const [{ data: sub }, { count: clients }, { count: team }, { data: versions }] = await Promise.all([
    supabase.from("subscriptions").select("status, plan, current_period_end, cancel_at_period_end, updated_at").eq("workspace_id", workspaceId).maybeSingle(),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("archived_at", null),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).neq("role", "client"),
    supabase.from("deliverable_versions").select("size_bytes").eq("workspace_id", workspaceId),
  ]);
  return {
    subscription: sub,
    usage: {
      clients: clients ?? 0,
      team: team ?? 0,
      storageBytes: (versions ?? []).reduce((sum, v) => sum + v.size_bytes, 0),
    },
  };
}
