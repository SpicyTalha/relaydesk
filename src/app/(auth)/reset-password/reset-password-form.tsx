"use client";

import { useActionState, useState } from "react";
import { CheckCircleIcon, CircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/auth/password-input";
import { AUTH_BUTTON, AUTH_INPUT } from "@/components/auth/signup-steps";
import { initialFormState } from "@/lib/form-state";
import { updatePassword } from "../actions";

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);
  const [length, setLength] = useState(0);
  const longEnough = length >= 8;

  return (
    <form action={action} noValidate className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Field data-invalid={!!state.fieldErrors?.password}>
        <FieldLabel htmlFor="password">New password</FieldLabel>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          autoFocus
          aria-invalid={!!state.fieldErrors?.password}
          aria-describedby="password-hint"
          onChange={(e) => setLength(e.currentTarget.value.length)}
          className={AUTH_INPUT}
        />
        {state.fieldErrors?.password && !longEnough ? (
          <FieldError id="password-hint" errors={state.fieldErrors.password.map((message) => ({ message }))} />
        ) : (
          <FieldDescription id="password-hint" className={cn("flex items-center gap-1.5", longEnough && "text-status-approved")}>
            {longEnough ? <CheckCircleIcon weight="fill" className="size-4" aria-hidden="true" /> : <CircleIcon className="size-4" aria-hidden="true" />}
            At least 8 characters
          </FieldDescription>
        )}
      </Field>
      <SubmitButton className={AUTH_BUTTON} size="lg" pendingText="Saving">
        Save new password
      </SubmitButton>
    </form>
  );
}
