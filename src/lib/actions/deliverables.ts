"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { dbFail, friendlyDbError } from "@/lib/db-errors";
import { ALLOWED_MIME_TYPES, maxUploadBytes, safeFileName } from "@/lib/uploads";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; upgrade?: boolean };

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional()
  .transform((v) => v || null);

// ---------------------------------------------------------------------------
// Create a deliverable (draft). The file is uploaded next, straight from the browser.
// ---------------------------------------------------------------------------

const createSchema = z.object({
  slug: z.string().min(1),
  clientId: z.string().uuid(),
  title: z.string().trim().min(1, "Give it a title.").max(120, "Keep the title under 120 characters."),
  description: z.string().trim().max(2000).default(""),
  dueOn: dateSchema,
});

export async function createDeliverable(input: z.input<typeof createSchema>): Promise<Result<{ deliverableId: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { slug, clientId, title, description, dueOn } = parsed.data;

  const ws = await getWorkspaceContext(slug);
  if (!ws.isTeam) return { ok: false, error: "Only the agency team can add deliverables." };
  if (ws.suspended) return { ok: false, error: "This studio is suspended." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .insert({ workspace_id: ws.id, client_id: clientId, title, description, due_on: dueOn })
    .select("id")
    .single();
  if (error) return dbFail(error, "We couldn't create the deliverable.");
  return { ok: true, deliverableId: data.id };
}

// ---------------------------------------------------------------------------
// Upload: the server picks the version id and the storage path, the browser uploads,
// then the server registers the version. The database checks the path matches.
// ---------------------------------------------------------------------------

const prepareSchema = z.object({
  slug: z.string().min(1),
  deliverableId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(120),
  size: z.number().int().positive(),
});

export async function prepareUpload(
  input: z.input<typeof prepareSchema>,
): Promise<Result<{ versionId: string; path: string; fileName: string }>> {
  const parsed = prepareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That file can't be uploaded." };
  const { slug, deliverableId, fileName, mimeType, size } = parsed.data;

  const ws = await getWorkspaceContext(slug);
  if (!ws.isTeam) return { ok: false, error: "Only the agency team can upload files." };

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: "Upload an image, PDF, video, or an Office, Figma or ZIP file." };
  }
  const limit = maxUploadBytes(ws.isDemo);
  if (size > limit) {
    return { ok: false, error: `Files can be up to ${Math.round(limit / 1024 / 1024)} MB${ws.isDemo ? " in the demo" : ""}.` };
  }

  const supabase = await createClient();
  const { data: d } = await supabase
    .from("deliverables")
    .select("id, workspace_id, client_id")
    .eq("id", deliverableId)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!d) return { ok: false, error: "We couldn't find that deliverable." };

  const versionId = crypto.randomUUID();
  const name = safeFileName(fileName);
  return { ok: true, versionId, fileName: name, path: `${d.workspace_id}/${d.client_id}/${d.id}/${versionId}/${name}` };
}

const registerSchema = z.object({
  slug: z.string().min(1),
  deliverableId: z.string().uuid(),
  versionId: z.string().uuid(),
  fileName: z.string().min(1).max(180),
  mimeType: z.string().max(120),
  size: z.number().int().positive(),
  note: z.string().trim().max(1000).default(""),
  requestApproval: z.boolean().default(false),
  dueOn: dateSchema,
  /** When set, the action navigates there itself (with fresh data) instead of returning. */
  redirectTo: z.string().startsWith("/w/").optional(),
});

export async function registerVersion(input: z.input<typeof registerSchema>): Promise<Result<{ version: number }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "We couldn't save that upload." };
  const { slug, deliverableId, versionId, fileName, mimeType, size, note, requestApproval, dueOn, redirectTo } = parsed.data;

  const ws = await getWorkspaceContext(slug);
  const supabase = await createClient();
  const { data: d } = await supabase
    .from("deliverables")
    .select("workspace_id, client_id")
    .eq("id", deliverableId)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!d) return { ok: false, error: "We couldn't find that deliverable." };

  const { data: version, error } = await supabase
    .from("deliverable_versions")
    .insert({
      id: versionId,
      deliverable_id: deliverableId,
      workspace_id: d.workspace_id,
      client_id: d.client_id,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: size,
      note,
      storage_path: `${d.workspace_id}/${d.client_id}/${deliverableId}/${versionId}/${fileName}`,
    })
    .select("version")
    .single();
  if (error) {
    // The row failed (for example, over the storage quota): remove the orphaned file.
    await createAdminClient()
      .storage.from("deliverables")
      .remove([`${d.workspace_id}/${d.client_id}/${deliverableId}/${versionId}/${fileName}`]);
    return dbFail(error, "We couldn't save that upload.");
  }

  if (requestApproval) {
    const { error: rpcError } = await supabase.rpc("request_approval", { p_deliverable: deliverableId, p_due_on: dueOn ?? undefined });
    if (rpcError) return { ok: false, error: friendlyDbError(rpcError).message };
  }

  if (redirectTo) {
    revalidatePath(`/w/${slug}`, "layout");
    redirect(redirectTo);
  }
  refresh();
  return { ok: true, version: version.version };
}

// ---------------------------------------------------------------------------
// Approval flow
// ---------------------------------------------------------------------------

export async function requestApproval(input: { slug: string; deliverableId: string; dueOn?: string | null }): Promise<Result> {
  const parsed = z
    .object({ slug: z.string().min(1), deliverableId: z.string().uuid(), dueOn: dateSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the due date." };

  await getWorkspaceContext(parsed.data.slug);
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_approval", {
    p_deliverable: parsed.data.deliverableId,
    p_due_on: parsed.data.dueOn ?? undefined,
  });
  if (error) return { ok: false, error: friendlyDbError(error).message };
  refresh();
  return { ok: true };
}

const reviewSchema = z
  .object({
    slug: z.string().min(1),
    deliverableId: z.string().uuid(),
    decision: z.enum(["approved", "changes_requested"]),
    note: z.string().trim().max(2000).default(""),
  })
  .refine((v) => v.decision === "approved" || v.note.length > 0, {
    message: "Tell the team what to change.",
    path: ["note"],
  });

export async function submitReview(input: z.input<typeof reviewSchema>): Promise<Result> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };

  await getWorkspaceContext(parsed.data.slug);
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", {
    p_deliverable: parsed.data.deliverableId,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note,
  });
  if (error) return { ok: false, error: friendlyDbError(error).message };
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Edit and delete
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  slug: z.string().min(1),
  deliverableId: z.string().uuid(),
  title: z.string().trim().min(1, "Give it a title.").max(120),
  description: z.string().trim().max(2000).default(""),
  dueOn: dateSchema,
});

export async function updateDeliverable(input: z.input<typeof updateSchema>): Promise<Result> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const ws = await getWorkspaceContext(parsed.data.slug);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .update({ title: parsed.data.title, description: parsed.data.description, due_on: parsed.data.dueOn })
    .eq("id", parsed.data.deliverableId)
    .eq("workspace_id", ws.id)
    .select("id");
  if (error) return { ok: false, error: friendlyDbError(error).message };
  if (!data.length) return { ok: false, error: "You can't edit this deliverable." };
  refresh();
  return { ok: true };
}

export async function deleteDeliverable(input: { slug: string; deliverableId: string }): Promise<Result<{ clientId: string }>> {
  const parsed = z.object({ slug: z.string().min(1), deliverableId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const ws = await getWorkspaceContext(parsed.data.slug);

  const supabase = await createClient();
  const { data: versions } = await supabase
    .from("deliverable_versions")
    .select("storage_path")
    .eq("deliverable_id", parsed.data.deliverableId);

  // The delete runs as the user, so RLS decides whether it's allowed.
  const { data, error } = await supabase
    .from("deliverables")
    .delete()
    .eq("id", parsed.data.deliverableId)
    .eq("workspace_id", ws.id)
    .select("client_id");
  if (error) return { ok: false, error: friendlyDbError(error).message };
  if (!data.length) return { ok: false, error: "You can't delete this deliverable." };

  // Only after the row is gone do we clean up its files with the service role.
  const paths = (versions ?? []).map((v) => v.storage_path);
  if (paths.length) await createAdminClient().storage.from("deliverables").remove(paths);

  refresh();
  return { ok: true, clientId: data[0].client_id };
}
