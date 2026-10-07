"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import { fieldErrorsOf, type FormState } from "@/lib/form-state";

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // One message for wrong email and wrong password, so the form doesn't reveal which accounts exist.
    const message =
      error.code === "email_not_confirmed"
        ? "Confirm your email first. We sent you a link when you signed up."
        : error.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : "That email and password don't match.";
    return { error: message, values };
  }

  redirect(safeNext(formData.get("next")));
}

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(80, "Keep it under 80 characters."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Use 72 characters or fewer."),
});

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { fullName: String(formData.get("fullName") ?? ""), email: String(formData.get("email") ?? "") };
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  const next = safeNext(formData.get("next"), "/onboarding");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${(await headers()).get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    const message =
      error.code === "weak_password"
        ? "Pick a stronger password: longer, and not a common one."
        : error.status === 429
          ? "Too many sign-ups from this network. Try again in a few minutes."
          : "We couldn't create your account. Try again.";
    return { error: message, values };
  }

  // With email confirmation on, there is no session yet: tell the user to check their inbox.
  if (!data.session) {
    return { success: `We sent a confirmation link to ${parsed.data.email}. Open it to finish signing up.`, values };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
