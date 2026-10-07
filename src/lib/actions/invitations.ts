"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";

export async function acceptInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = z.string().min(20).max(200).safeParse(formData.get("token"));
  if (!token.success) return { error: "This invitation link is broken." };
  await requireUser(`/invite/${token.data}`);

  const supabase = await createClient();
  const { data: workspaceId, error } = await supabase.rpc("accept_invitation", { p_token: token.data });
  if (error) return { error: error.code === "P0001" ? error.message : "We couldn't accept the invitation. Try again." };

  const { data: ws } = await supabase.from("workspaces").select("slug").eq("id", workspaceId).single();
  revalidatePath("/w", "layout");
  redirect(ws ? `/w/${ws.slug}` : "/w");
}
