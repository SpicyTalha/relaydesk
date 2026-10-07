"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { initialFormState } from "@/lib/form-state";
import { createWorkspace } from "./actions";

export function OnboardingForm() {
  const [state, action] = useActionState(createWorkspace, initialFormState);
  return (
    <form action={action} noValidate className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Field data-invalid={!!state.fieldErrors?.name}>
        <FieldLabel htmlFor="name">Agency name</FieldLabel>
        <Input
          id="name"
          name="name"
          placeholder="Kestrel Studio"
          autoComplete="organization"
          autoFocus
          required
          defaultValue={state.values?.name}
          aria-invalid={!!state.fieldErrors?.name}
        />
        <FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Creating workspace">
        Create workspace
      </SubmitButton>
    </form>
  );
}
