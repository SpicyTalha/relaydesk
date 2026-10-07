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

const password = z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer.");

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(80, "Keep it under 80 characters."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password,
});

async function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? `https://${(await headers()).get("host")}`;
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { fullName: String(formData.get("fullName") ?? ""), email: String(formData.get("email") ?? "") };
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  const next = safeNext(formData.get("next"), "/onboarding");
  const origin = await siteOrigin();

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

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = z.object({ email: signInSchema.shape.email }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error?.status === 429) return { error: "Too many requests. Wait a minute and try again.", values };
  if (error) console.error("Password reset email failed:", error.code ?? error.status);

  // The same answer whether or not the account exists, so the form doesn't reveal who has one.
  return {
    success: `If there's an account for ${parsed.data.email}, a reset link is on its way. It works once and expires in an hour.`,
    values,
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ password }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "This reset link has expired. Ask for a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message =
      error.code === "same_password"
        ? "That's your current password. Pick a new one."
        : error.code === "weak_password"
          ? "Pick a stronger password: longer, and not a common one."
          : "We couldn't change your password. Try again.";
    return { error: message };
  }

  // Anyone else signed in with the old password is signed out.
  await supabase.auth.signOut({ scope: "others" });
  redirect("/w");
}

export async function signOut(formData?: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // An invite opened while signed in as someone else comes straight back to the invite.
  redirect(safeNext(formData?.get("next"), "/login"));
}
