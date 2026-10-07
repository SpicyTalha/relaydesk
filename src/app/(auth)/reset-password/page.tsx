import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthHeading, AUTH_BUTTON } from "@/components/auth/signup-steps";
import { getCurrentUser } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
      <ResetPassword />
    </Suspense>
  );
}

/** The reset link signs the person in through /auth/callback; without that session the link was bad or used. */
async function ResetPassword() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-8">
        <AuthHeading title="That link has expired.">Reset links work once and only for an hour. Ask for a fresh one.</AuthHeading>
        <Link href="/forgot-password" className={`${AUTH_BUTTON} inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90`}>
          Send a new link
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <AuthHeading title="Set a new password.">
        For <span className="font-semibold text-ink">{user.email}</span>. You&apos;ll stay signed in here.
      </AuthHeading>
      <ResetPasswordForm />
    </div>
  );
}
