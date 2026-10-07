import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SetupProgress = {
  steps: { key: "client" | "upload" | "approval" | "invite"; done: boolean; href: string | null }[];
  done: number;
};

/**
 * How far a studio is through setting up, read from what it has actually done, so the checklist
 * stays until the first client is invited, not just until the first client exists.
 */
export async function getSetupProgress(workspaceId: string, slug: string): Promise<SetupProgress> {
  const supabase = await createClient();
  const [clients, uploaded, requested, members, invites] = await Promise.all([
    supabase.from("clients").select("id").eq("workspace_id", workspaceId).is("archived_at", null).order("created_at").limit(1),
    supabase.from("deliverable_versions").select("deliverable_id").eq("workspace_id", workspaceId).order("created_at").limit(1),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).not("approval_requested_at", "is", null),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("role", "client"),
    supabase.from("invitations").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("role", "client").is("revoked_at", null),
  ]);

  const base = `/w/${slug}`;
  const client = clients.data?.[0]?.id ?? null;
  const deliverable = uploaded.data?.[0]?.deliverable_id ?? null;
  const steps: SetupProgress["steps"] = [
    { key: "client", done: !!client, href: null },
    { key: "upload", done: !!deliverable, href: client ? `${base}/c/${client}` : null },
    { key: "approval", done: (requested.count ?? 0) > 0, href: deliverable ? `${base}/d/${deliverable}` : null },
    { key: "invite", done: (members.count ?? 0) + (invites.count ?? 0) > 0, href: client ? `${base}/c/${client}` : null },
  ];
  return { steps, done: steps.filter((s) => s.done).length };
}
