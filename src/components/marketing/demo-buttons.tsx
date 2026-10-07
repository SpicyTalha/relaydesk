"use client";

import { useActionState } from "react";
import { Building2, UserRound } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { initialFormState } from "@/lib/form-state";
import { startDemo } from "@/app/demo/actions";

export function DemoButtons({ size = "lg" }: { size?: "default" | "lg" }) {
  const [state, action] = useActionState(startDemo, initialFormState);
  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton size={size} name="as" value="owner" pendingText="Preparing your copy" className="h-11 px-5">
          <Building2 />
          Try it as the agency
        </SubmitButton>
        <SubmitButton size={size} variant="outline" name="as" value="client" pendingText="Preparing your copy" className="h-11 bg-background px-5">
          <UserRound />
          Try it as a client
        </SubmitButton>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
