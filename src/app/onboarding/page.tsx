import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Name your workspace" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-svh flex-col px-5 py-6 sm:px-10">
      <Logo />
      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">What&apos;s your agency called?</h1>
            <p className="text-sm text-muted-foreground">
              Clients see this name on every page they open. You can change it later.
            </p>
          </div>
          <Suspense fallback={<Skeleton className="h-28 w-full" />}>
            <OnboardingForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
