"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: true } | { ok: false; error: string };

/** Suspends a studio (read-only, enforced in the database) or lifts it, with a reason in the audit log. */
export async function setStudioSuspended(input: { workspaceId: string; suspended: boolean; reason: string }): Promise<Result> {
  const parsed = z
    .object({ workspaceId: z.string().uuid(), suspended: z.boolean(), reason: z.string().trim().min(3, "Say why, for the audit log.").max(500) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const user = await getCurrentUser();
  if (!user?.isPlatformAdmin) return { ok: false, error: "Only platform admins can do that." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspaces")
    .update({ suspended_at: parsed.data.suspended ? new Date().toISOString() : null })
    .eq("id", parsed.data.workspaceId)
    .select("name")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "We couldn't update that studio." };

  const { error: auditError } = await admin.from("audit_log").insert({
    actor_id: user.id,
    action: parsed.data.suspended ? "studio.suspended" : "studio.unsuspended",
    workspace_id: parsed.data.workspaceId,
    metadata: { reason: parsed.data.reason, name: data.name },
  });
  if (auditError) return { ok: false, error: "The change was made, but the audit log didn't record it. Check the database." };
  refresh();
  return { ok: true };
}
