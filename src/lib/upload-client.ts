"use client";

import { createClient } from "@/lib/supabase/client";
import { prepareUpload, registerVersion } from "@/lib/actions/deliverables";

export type UploadStep = "preparing" | "uploading" | "saving";

/** Browser type for a picked file; design files often report "" so they get the generic type. */
export function fileMimeType(file: File): string {
  return file.type || "application/octet-stream";
}

/**
 * Upload a file as the next version of a deliverable:
 * the server picks the path, the browser uploads straight to private storage (no 4.5 MB
 * function body limit), then the server registers the version row.
 */
export async function uploadVersion(opts: {
  slug: string;
  deliverableId: string;
  file: File;
  note?: string;
  requestApproval?: boolean;
  dueOn?: string | null;
  redirectTo?: string;
  onStep?: (step: UploadStep) => void;
}): Promise<{ ok: true; version: number } | { ok: false; error: string; upgrade?: boolean }> {
  const { slug, deliverableId, file, onStep } = opts;
  const mimeType = fileMimeType(file);

  onStep?.("preparing");
  const prep = await prepareUpload({ slug, deliverableId, fileName: file.name, mimeType, size: file.size });
  if (!prep.ok) return prep;

  onStep?.("uploading");
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("deliverables")
    .upload(prep.path, file, { contentType: mimeType, upsert: false, cacheControl: "3600" });
  if (error) return { ok: false, error: "The upload didn't go through. Check your connection and try again." };

  onStep?.("saving");
  return registerVersion({
    slug,
    deliverableId,
    versionId: prep.versionId,
    fileName: prep.fileName,
    mimeType,
    size: file.size,
    note: opts.note ?? "",
    requestApproval: opts.requestApproval ?? false,
    dueOn: opts.dueOn ?? null,
    redirectTo: opts.redirectTo,
  });
}
