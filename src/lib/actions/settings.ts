"use server";

import { redirect } from "next/navigation";
import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { dbFail } from "@/lib/db-errors";
import { fieldErrorsOf, type FormState } from "@/lib/form-state";

type Result = { ok: true } | { ok: false; error: string };

export async function renameWorkspace(input: { slug: string; name: string }): Promise<Result> {
  const parsed = z
    .object({ slug: z.string().min(1), name: z.string().trim().min(2, "Use at least 2 characters.").max(60, "Keep it under 60 characters.") })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the name." };
  const ws = await getWorkspaceContext(parsed.data.slug);
  if (!ws.isOwner) return { ok: false, error: "Only owners can rename the studio." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("workspaces").update({ name: parsed.data.name }).eq("id", ws.id).select("id");
  if (error) return dbFail(error);
  if (!data.length) return { ok: false, error: "You can't rename this studio." };
  revalidatePath(`/w/${parsed.data.slug}`, "layout");
  return { ok: true };
}

export async function updateProfile(input: { fullName: string }): Promise<Result> {
  const parsed = z
    .object({ fullName: z.string().trim().min(2, "Enter your name.").max(80, "Keep it under 80 characters.") })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your name." };
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", user.id);
  if (error) return dbFail(error);
  refresh();
  return { ok: true };
}

/** Deletes the workspace and every file in it. Typing the name confirms intent. */
export async function deleteWorkspace(input: { slug: string; confirmName: string }): Promise<Result> {
  const ws = await getWorkspaceContext(input.slug);
  if (!ws.isOwner) return { ok: false, error: "Only owners can delete the studio." };
  if (ws.isDemo) return { ok: false, error: "Demo studios are deleted automatically after 24 hours." };
  if (input.confirmName.trim() !== ws.name) return { ok: false, error: "Type the studio name exactly to confirm." };

  const supabase = await createClient();
  const { data: versions } = await supabase.from("deliverable_versions").select("storage_path").eq("workspace_id", ws.id);

  // RLS decides; only an owner's delete succeeds. Rows cascade.
  const { data, error } = await supabase.from("workspaces").delete().eq("id", ws.id).select("id");
  if (error) return dbFail(error);
  if (!data.length) return { ok: false, error: "You can't delete this studio." };

  const paths = (versions ?? []).map((v) => v.storage_path);
  const admin = createAdminClient();
  for (let i = 0; i < paths.length; i += 100) await admin.storage.from("deliverables").remove(paths.slice(i, i + 100));

  revalidatePath("/w", "layout");
  redirect("/w");
}

const passwordChange = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer."),
});

/** Changing a password needs the current one, so an unattended signed-in browser can't lock its owner out. */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordChange.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const user = await requireUser();
  const supabase = await createClient();
  const { error: wrong } = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.current });
  if (wrong) {
    return { fieldErrors: { current: [wrong.status === 429 ? "Too many attempts. Wait a minute and try again." : "That's not your current password."] } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.next });
  if (error) {
    const message =
      error.code === "same_password"
        ? "That's the password you already have. Pick a new one."
        : error.code === "weak_password"
          ? "Pick a stronger password: longer, and not a common one."
          : "We couldn't change your password. Try again.";
    return { fieldErrors: { next: [message] } };
  }

  await supabase.auth.signOut({ scope: "others" });
  return { success: "Password changed. Any other devices were signed out." };
}
