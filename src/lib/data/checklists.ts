import "server-only";
import { createClient } from "@/lib/supabase/server";
import { planById } from "@/lib/billing/plans";
import type { WorkspaceContext } from "@/lib/data/workspace";

/** Demo copies get a small fixed allowance, matching private.enforce_ai_quota(). */
export const DEMO_AI_ALLOWANCE = 3;

export async function aiAllowance(ws: Pick<WorkspaceContext, "id" | "plan" | "isDemo">) {
  const limit = ws.isDemo ? DEMO_AI_ALLOWANCE : planById(ws.plan).limits.aiPerMonth;
  if (limit === 0) return { limit, used: 0, left: 0 };
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const supabase = await createClient();
  const { count } = await supabase
    .from("revision_checklists")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ws.id)
    .gte("created_at", monthStart.toISOString());
  const used = count ?? 0;
  return { limit, used, left: Math.max(0, limit - used) };
}

export type ChecklistView = {
  id: string;
  versionId: string | null;
  model: string;
  createdAt: string;
  items: { id: string; body: string; quote: string; commentId: string | null; done: boolean }[];
};

/** The newest checklist for a deliverable. Team only; RLS returns nothing to clients. */
export async function getLatestChecklist(workspaceId: string, deliverableId: string): Promise<ChecklistView | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("revision_checklists")
    .select("id, version_id, model, created_at, items:checklist_items(id, position, body, quote, comment_id, done_at)")
    .eq("workspace_id", workspaceId)
    .eq("deliverable_id", deliverableId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    versionId: data.version_id,
    model: data.model,
    createdAt: data.created_at,
    items: [...data.items]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ id: i.id, body: i.body, quote: i.quote, commentId: i.comment_id, done: i.done_at !== null })),
  };
}
