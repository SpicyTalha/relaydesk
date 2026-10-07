"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { friendlyDbError } from "@/lib/db-errors";
import { fieldErrorsOf, type FormState } from "@/lib/form-state";

const accents = ["slate", "blue", "emerald", "amber", "rose", "violet", "cyan", "orange"] as const;

const createSchema = z.object({
  slug: z.string().min(1),
  name: z.string().trim().min(1, "Give the client a name.").max(80, "Keep it under 80 characters."),
  accent: z.enum(accents).default("blue"),
});

export type CreateClientState = FormState & { upgrade?: boolean; clientId?: string };

export async function createClientSpace(_prev: CreateClientState, formData: FormData): Promise<CreateClientState> {
  const values = { name: String(formData.get("name") ?? "") };
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  const ws = await getWorkspaceContext(parsed.data.slug);
  if (!ws.isTeam) return { error: "Only the agency team can add clients.", values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ workspace_id: ws.id, name: parsed.data.name, accent: parsed.data.accent })
    .select("id")
    .single();

  if (error) {
    const friendly = friendlyDbError(error, "We couldn't add that client.");
    return { error: friendly.message, upgrade: friendly.upgrade, values };
  }

  // Fresh sidebar (layout) data, then go to the new client's page.
  revalidatePath(`/w/${parsed.data.slug}`, "layout");
  redirect(`/w/${parsed.data.slug}/c/${data.id}`);
}
