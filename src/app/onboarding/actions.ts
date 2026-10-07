"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { fieldErrorsOf, type FormState } from "@/lib/form-state";
import { randomSuffix, slugify } from "@/lib/slug";

const schema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(60, "Keep it under 60 characters."),
});

export async function createWorkspace(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser("/onboarding");
  const values = { name: String(formData.get("name") ?? "") };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  const supabase = await createClient();
  const base = slugify(parsed.data.name);

  // Try the clean slug first, then add a short suffix if another agency already has it.
  for (const slug of [base, `${base}-${randomSuffix()}`, `${base}-${randomSuffix(6)}`]) {
    const { error } = await supabase.from("workspaces").insert({ name: parsed.data.name, slug });
    if (!error) redirect(`/w/${slug}`);
    if (error.code !== "23505") {
      return { error: "We couldn't create the workspace. Try again.", values };
    }
  }
  return { error: "That name is taken. Try a slightly different one.", values };
}
