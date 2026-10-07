"use client";

import { useActionState } from "react";
import { BuildingsIcon, UserIcon } from "@phosphor-icons/react";
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
      <FieldSeparator className="mt-0 mb-4 text-ink/65">or explore the demo, no account needed</FieldSeparator>
      <form action={action} className="grid grid-cols-2 gap-2">
        <SubmitButton variant="outline" name="as" value="owner" pendingText="Preparing" className="h-11 rounded-full bg-white">
          <BuildingsIcon />
          As the agency
        </SubmitButton>
        <SubmitButton variant="outline" name="as" value="client" pendingText="Preparing" className="h-11 rounded-full bg-white">
          <UserIcon />
          As a client
        </SubmitButton>
      </form>
      {state.error && <p className="text-center text-sm text-destructive">{state.error}</p>}
      <p className="text-center text-xs text-ink/65">
        Your own private copy with sample data, deleted after 24 hours.
      </p>
    </div>
  );
}
