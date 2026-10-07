"use client";

import { useActionState } from "react";
import { Building2, UserRound } from "lucide-react";
import { FieldSeparator } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";
import { initialFormState } from "@/lib/form-state";
import { startDemo } from "@/app/demo/actions";

/** One click into a private copy of the demo agency, as the agency or as its client. */
export function DemoAccess({ next }: { next?: string }) {
  const [state, action] = useActionState(startDemo, initialFormState);
  if (next) return null; // Someone following an invite or deep link wants their own account, not the demo.

  return (
    <div className="space-y-4">
      <FieldSeparator>or explore the demo</FieldSeparator>
      <form action={action} className="grid grid-cols-2 gap-2">
        <SubmitButton variant="outline" name="as" value="owner" pendingText="Preparing">
          <Building2 />
          As the agency
        </SubmitButton>
        <SubmitButton variant="outline" name="as" value="client" pendingText="Preparing">
          <UserRound />
          As a client
        </SubmitButton>
      </form>
      {state.error && <p className="text-center text-sm text-destructive">{state.error}</p>}
      <p className="text-center text-xs text-muted-foreground">
        You get your own private copy with sample data. It&apos;s deleted after 24 hours.
      </p>
    </div>
  );
}
