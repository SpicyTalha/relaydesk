"use client";

import { useActionState } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import { initialFormState } from "@/lib/form-state";
import { acceptInvitation } from "@/lib/actions/invitations";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action] = useActionState(acceptInvitation, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <SubmitButton size="lg" className="w-full" pendingText="Joining">
        Accept invitation
      </SubmitButton>
    </form>
  );
}
