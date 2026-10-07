"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { createSandbox, hashIp, recentSandboxCount, SANDBOXES_PER_IP_PER_HOUR } from "@/lib/demo/sandbox";
import type { FormState } from "@/lib/form-state";

/** Signs the browser in as a demo user with a one-time token generated on the server. */
async function signInAs(email: string): Promise<boolean> {
  const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) return false;
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: data.properties.hashed_token });
  return !verifyError;
}

export async function startDemo(_prev: FormState, formData: FormData): Promise<FormState> {
  const as = formData.get("as") === "client" ? "client" : "owner";

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const ipHash = hashIp(ip);
  if ((await recentSandboxCount(ipHash)) >= SANDBOXES_PER_IP_PER_HOUR) {
    return { error: "You've started a few demos in the last hour. Try again a little later." };
  }

  let target: string;
  try {
    // Leave any existing session (a real account or an older demo) before entering the new copy.
    await (await createClient()).auth.signOut();
    const sandbox = await createSandbox(ipHash);
    const ok = await signInAs(as === "client" ? sandbox.clientEmail : sandbox.ownerEmail);
    if (!ok) return { error: "The demo couldn't sign you in. Try again." };
    target = `/w/${sandbox.slug}`;
  } catch (err) {
    console.error("demo sandbox failed", err);
    return { error: "The demo couldn't start. Try again in a moment." };
  }
  redirect(target);
}

/**
 * "View as client" / "View as agency" inside a sandbox. Only switches between users of the
 * same demo workspace the visitor is already signed into.
 */
export async function switchDemoRole(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const to = formData.get("to") === "client" ? "client" : "owner";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: ws } = await admin.from("workspaces").select("id, is_demo").eq("slug", slug).maybeSingle();
  if (!ws?.is_demo) redirect(`/w/${slug}`);

  const { data: members } = await admin.from("memberships").select("user_id, role, client_id, created_at").eq("workspace_id", ws.id).order("created_at");
  if (!members?.some((m) => m.user_id === user.id)) redirect("/login");

  // The first client user is Daniel at Northwind Coffee, who has the richest history.
  const target = to === "client" ? members.find((m) => m.role === "client") : members.find((m) => m.role === "owner");
  if (!target) redirect(`/w/${slug}`);
  const { data: targetUser } = await admin.auth.admin.getUserById(target.user_id);
  if (!targetUser.user?.email || !(await signInAs(targetUser.user.email))) redirect(`/w/${slug}`);
  redirect(`/w/${slug}`);
}
