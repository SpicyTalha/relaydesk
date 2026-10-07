import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your workspace" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Start your workspace</h1>
        <p className="text-sm text-muted-foreground">Free for 2 clients. No card needed.</p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4" aria-hidden="true">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}
