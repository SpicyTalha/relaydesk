import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { DeliverableStatus } from "@/lib/status";

export type ClientAccent = "slate" | "blue" | "emerald" | "amber" | "rose" | "violet" | "cyan" | "orange";

export type ClientSpace = {
  id: string;
  name: string;
  accent: ClientAccent;
  counts: Record<DeliverableStatus, number>;
  /** Items where someone has to act: the client (in review) or the team (changes requested). */
  open: number;
};

export const getClientSpaces = cache(async (workspaceId: string): Promise<ClientSpace[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, accent, deliverables(status)")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("name");
  if (error) throw error;

  return data.map((c) => {
    const counts: Record<DeliverableStatus, number> = { draft: 0, in_review: 0, changes_requested: 0, approved: 0 };
    for (const d of c.deliverables) counts[d.status]++;
    return {
      id: c.id,
      name: c.name,
      accent: c.accent as ClientAccent,
      counts,
      open: counts.in_review + counts.changes_requested,
    };
  });
});

export const ACCENT_SWATCH: Record<ClientAccent, string> = {
  slate: "bg-slate-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  orange: "bg-orange-500",
};

export type ClientPerson = { userId: string; name: string; email: string | null; role: "client" | "owner" | "member" };

/** One client space with the client-side people who can access it. RLS returns nothing if the user can't see it. */
export const getClientSpace = cache(async (workspaceId: string, clientId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, accent, created_at")
    .eq("workspace_id", workspaceId)
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("workspace_id", workspaceId)
    .eq("client_id", clientId);
  const ids = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };

  return {
    id: data.id,
    name: data.name,
    accent: data.accent as ClientAccent,
    createdAt: data.created_at,
    people: (members ?? []).map((m) => ({
      userId: m.user_id,
      name: profiles?.find((p) => p.id === m.user_id)?.full_name || "Client",
      email: null,
      role: m.role,
    })) as ClientPerson[],
  };
});
