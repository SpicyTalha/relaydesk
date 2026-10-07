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
});

export async function addComment(input: z.input<typeof addSchema>): Promise<Result> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your comment." };
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
