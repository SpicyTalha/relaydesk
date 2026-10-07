import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthHeading } from "@/components/auth/signup-steps";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <AuthHeading title="Welcome back.">Sign in to see what&apos;s waiting for review.</AuthHeading>
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}
