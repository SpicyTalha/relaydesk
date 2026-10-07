"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { dbFail } from "@/lib/db-errors";

type Result = { ok: true } | { ok: false; error: string };

const addSchema = z.object({
  slug: z.string().min(1),
  deliverableId: z.string().uuid(),
  versionId: z.string().uuid().nullable().optional(),
  body: z.string().trim().min(1, "Write something first.").max(4000, "Keep comments under 4,000 characters."),
  pin: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).nullable().optional(),
});

export async function addComment(input: z.input<typeof addSchema>): Promise<Result> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your comment." };
  if (parsed.data.pin && !parsed.data.versionId) return { ok: false, error: "Pins belong to a version." };
  const ws = await getWorkspaceContext(parsed.data.slug);

  const supabase = await createClient();
  const { data: d } = await supabase
    .from("deliverables")
    .select("workspace_id, client_id")
    .eq("id", parsed.data.deliverableId)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!d) return { ok: false, error: "We couldn't find that deliverable." };

  const { error } = await supabase.from("comments").insert({
    deliverable_id: parsed.data.deliverableId,
    workspace_id: d.workspace_id,
    client_id: d.client_id,
    version_id: parsed.data.versionId ?? null,
    body: parsed.data.body,
    // Four decimal places is a tenth of a pixel on a 1,000 px image: plenty, and what the column stores.
    pin_x: parsed.data.pin ? Math.round(parsed.data.pin.x * 10000) / 10000 : null,
    pin_y: parsed.data.pin ? Math.round(parsed.data.pin.y * 10000) / 10000 : null,
  });
  if (error) return dbFail(error, "We couldn't post your comment.");
  refresh();
  return { ok: true };
}

export async function deleteComment(input: { slug: string; commentId: string }): Promise<Result> {
  const parsed = z.object({ slug: z.string().min(1), commentId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const ws = await getWorkspaceContext(parsed.data.slug);

  // Soft delete keeps the thread readable ("Comment deleted") and the audit trail intact.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.commentId)
    .eq("workspace_id", ws.id)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return { ok: false, error: "You can only delete your own comments." };
  refresh();
  return { ok: true };
}

/** The team marks feedback as dealt with, or reopens it. The database checks it's really the team. */
export async function setCommentResolved(input: { slug: string; commentId: string; resolved: boolean }): Promise<Result> {
  const parsed = z.object({ slug: z.string().min(1), commentId: z.string().uuid(), resolved: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const ws = await getWorkspaceContext(parsed.data.slug);
  if (!ws.isTeam) return { ok: false, error: "Only your studio can resolve feedback." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_comment_resolved", { p_comment: parsed.data.commentId, p_resolved: parsed.data.resolved });
  if (error) return dbFail(error);
  refresh();
  return { ok: true };
}
