import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";

export type Role = Database["public"]["Enums"]["member_role"];
export type Plan = Database["public"]["Enums"]["plan_tier"];

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  isDemo: boolean;
  suspended: boolean;
  role: Role;
  clientId: string | null;
};

/** Every workspace the signed-in user belongs to, with their role in it. */
export const getMyWorkspaces = cache(async (): Promise<WorkspaceSummary[]> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("role, client_id, workspace:workspaces!inner(id, name, slug, plan, is_demo, suspended_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    plan: m.workspace.plan,
    isDemo: m.workspace.is_demo,
    suspended: m.workspace.suspended_at !== null,
    role: m.role,
    clientId: m.client_id,
  }));
});

export type WorkspaceContext = WorkspaceSummary & {
  isTeam: boolean;
  isOwner: boolean;
  userId: string;
};

/** The workspace for a URL slug, or a 404 if the user isn't a member (RLS hides it either way). */
export const getWorkspaceContext = cache(async (slug: string): Promise<WorkspaceContext> => {
  const user = await requireUser(`/w/${slug}`);
  const workspace = (await getMyWorkspaces()).find((w) => w.slug === slug);
  if (!workspace) notFound();
  return {
    ...workspace,
    isTeam: workspace.role !== "client",
    isOwner: workspace.role === "owner",
    userId: user.id,
  };
});

export const getProfile = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single();
  return { id: user.id, email: user.email, fullName: data?.full_name ?? "", avatarUrl: data?.avatar_url ?? null };
});
