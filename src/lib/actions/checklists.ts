"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { getComments, pinNumbers } from "@/lib/data/comments";
import { aiAllowance } from "@/lib/data/checklists";
import { draftChecklist, type Feedback } from "@/lib/ai/checklist";
import { dbFail } from "@/lib/db-errors";

type Result = { ok: true } | { ok: false; error: string; upgrade?: boolean };

/**
 * One click: the client's open notes on the latest version become a revision checklist.
 * Team only, Pro and Studio only, capped per month in the database, and never twice in quick succession.
 */
export async function generateChecklist(input: { slug: string; deliverableId: string }): Promise<Result> {
  const parsed = z.object({ slug: z.string().min(1), deliverableId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const [ws, user] = await Promise.all([getWorkspaceContext(parsed.data.slug), getCurrentUser()]);
  if (!ws.isTeam || !user) return { ok: false, error: "Only your studio can make checklists." };

  const allowance = await aiAllowance(ws);
  if (allowance.limit === 0) return { ok: false, error: "AI checklists come with Pro and Studio.", upgrade: true };
  if (allowance.left <= 0) return { ok: false, error: "You've used this month's AI checklists.", upgrade: !ws.isDemo };

  const supabase = await createClient();
  const { data: d } = await supabase
    .from("deliverables")
    .select("id, title, workspace_id, client_id, versions:deliverable_versions(id, version), reviews(id, decision, note, version_id)")
    .eq("id", parsed.data.deliverableId)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!d) return { ok: false, error: "We couldn't find that deliverable." };
  const latest = [...d.versions].sort((a, b) => b.version - a.version)[0];
  if (!latest) return { ok: false, error: "Upload a version first." };

  // A quick double-click shouldn't spend two checklists.
  const { data: recent } = await supabase
    .from("revision_checklists")
    .select("id")
    .eq("deliverable_id", d.id)
    .eq("created_by", user.id)
    .gte("created_at", new Date(Date.now() - 20_000).toISOString())
    .limit(1);
  if (recent?.length) return { ok: false, error: "A checklist was just made. Give it a few seconds." };

  const comments = await getComments(ws.id, d.id);
  const pins = pinNumbers(comments);
  const feedback: Feedback[] = [
    ...d.reviews
      .filter((r) => r.decision === "changes_requested" && r.version_id === latest.id && r.note.trim())
      .map((r) => ({ id: `review:${r.id}`, text: r.note.trim(), pin: null })),
    ...comments
      .filter((c) => !c.deleted && !c.resolvedAt && c.versionId === latest.id && (c.authorIsClient || c.pin))
      .map((c) => ({ id: c.id, text: c.body.trim(), pin: pins.get(c.id) ?? null })),
  ];
  if (!feedback.length) return { ok: false, error: `There are no open client notes on v${latest.version} yet.` };

  let draft: Awaited<ReturnType<typeof draftChecklist>>;
  try {
    draft = await draftChecklist(d.title, feedback);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Checklist generation failed:", message);
    // Vercel AI Gateway won't serve requests until the account owner adds a card (it unlocks the free credits).
    if (/credit card|customer_verification/i.test(message)) return { ok: false, error: "AI isn't switched on for this site yet. Nothing was used up." };
    return { ok: false, error: "The AI couldn't write a checklist just now. Nothing was used up; try again in a minute." };
  }
  if (!draft.items.length) return { ok: false, error: "The notes didn't ask for any changes, so there's nothing to check off." };

  const { data: checklist, error } = await supabase
    .from("revision_checklists")
    .insert({ workspace_id: ws.id, client_id: d.client_id, deliverable_id: d.id, version_id: latest.id, model: draft.model })
    .select("id")
    .single();
  if (error) return dbFail(error, "We couldn't save the checklist.");

  const { error: itemsError } = await supabase.from("checklist_items").insert(
    draft.items.slice(0, 20).map((item, position) => ({
      checklist_id: checklist.id,
      workspace_id: ws.id,
      position,
      body: item.body,
      quote: item.quote,
      comment_id: item.commentId,
    })),
  );
  if (itemsError) return dbFail(itemsError, "We couldn't save the checklist.");
  refresh();
  return { ok: true };
}

export async function toggleChecklistItem(input: { slug: string; itemId: string; done: boolean }): Promise<Result> {
  const parsed = z.object({ slug: z.string().min(1), itemId: z.string().uuid(), done: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const [ws, user] = await Promise.all([getWorkspaceContext(parsed.data.slug), getCurrentUser()]);
  if (!ws.isTeam || !user) return { ok: false, error: "Only your studio can tick these off." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .update(parsed.data.done ? { done_at: new Date().toISOString(), done_by: user.id } : { done_at: null, done_by: null })
    .eq("id", parsed.data.itemId)
    .eq("workspace_id", ws.id)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return { ok: false, error: "That item is gone." };
  refresh();
  return { ok: true };
}
