import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Start your studio" };

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <Suspense
        fallback={
          <div className="space-y-4" aria-hidden="true">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}
