import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthHeading } from "@/components/auth/signup-steps";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Name your studio" };

export default function OnboardingPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <OnboardingForm
          heading={
            <AuthHeading title="What's your studio called?">
              Clients see this name on everything you send them. You can change it later in Settings.
            </AuthHeading>
          }
        />
      </Suspense>
    </div>
  );
}
