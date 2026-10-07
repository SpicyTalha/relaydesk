import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/data/workspace";

export type Member = { membershipId: string; userId: string; name: string; role: Role; clientId: string | null; clientName: string | null; joinedAt: string };
export type PendingInvite = { id: string; email: string; role: Role; clientName: string | null; expiresAt: string; createdAt: string };

export async function getTeam(workspaceId: string): Promise<{ members: Member[]; invites: PendingInvite[] }> {
  const supabase = await createClient();
  const [{ data: memberships, error }, { data: invites }] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, user_id, role, client_id, created_at, client:clients(name)")
      .eq("workspace_id", workspaceId)
      .order("created_at"),
    supabase
      .from("invitations")
      .select("id, email, role, expires_at, created_at, client:clients(name)")
      .eq("workspace_id", workspaceId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw error;

  const ids = memberships.map((m) => m.user_id);
  const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };

  return {
    members: memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user_id,
      name: profiles?.find((p) => p.id === m.user_id)?.full_name || "Unnamed",
      role: m.role,
      clientId: m.client_id,
      clientName: m.client?.name ?? null,
      joinedAt: m.created_at,
    })),
    invites: (invites ?? []).map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      clientName: i.client?.name ?? null,
      expiresAt: i.expires_at,
      createdAt: i.created_at,
    })),
  };
}
