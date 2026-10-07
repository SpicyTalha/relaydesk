"use client";

import Link from "next/link";
import { useActionState } from "react";
import { EnvelopeOpenIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { AUTH_BUTTON, AUTH_INPUT } from "@/components/auth/signup-steps";
import { initialFormState } from "@/lib/form-state";
import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);

  return (
    <div className="space-y-6">
      {state.success ? (
        <Alert>
          <EnvelopeOpenIcon />
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : (
        <form action={action} noValidate className="space-y-5">
          {state.error && (
            <Alert variant="destructive">
              <WarningCircleIcon />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={!!state.fieldErrors?.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              defaultValue={state.values?.email}
              aria-invalid={!!state.fieldErrors?.email}
              className={AUTH_INPUT}
            />
            <FieldError errors={state.fieldErrors?.email?.map((message) => ({ message }))} />
          </Field>
          <SubmitButton className={AUTH_BUTTON} size="lg" pendingText="Sending the link">
            Send reset link
          </SubmitButton>
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-foreground underline underline-offset-4 hover:text-ink/70">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
