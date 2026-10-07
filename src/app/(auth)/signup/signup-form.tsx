"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { EnvelopeOpenIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { initialFormState } from "@/lib/form-state";
import { signUp } from "../actions";

export function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const presetEmail = searchParams.get("email") ?? "";
  const [state, action] = useActionState(signUp, initialFormState);

  if (state.success) {
    return (
      <Alert>
        <EnvelopeOpenIcon />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>{state.success}</AlertDescription>
      </Alert>
    );
  }

  const errs = (key: string) => state.fieldErrors?.[key]?.map((message) => ({ message }));

  return (
    <div className="space-y-6">
      <form action={action} noValidate className="space-y-5">
        <input type="hidden" name="next" value={next} />
        {state.error && (
          <Alert variant="destructive">
            <WarningCircleIcon />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <FieldGroup className="gap-4">
          <Field data-invalid={!!state.fieldErrors?.fullName}>
            <FieldLabel htmlFor="fullName">Your name</FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              defaultValue={state.values?.fullName}
              aria-invalid={!!state.fieldErrors?.fullName}
            />
            <FieldError errors={errs("fullName")} />
          </Field>
          <Field data-invalid={!!state.fieldErrors?.email}>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              defaultValue={state.values?.email ?? presetEmail}
              aria-invalid={!!state.fieldErrors?.email}
            />
            <FieldError errors={errs("email")} />
          </Field>
          <Field data-invalid={!!state.fieldErrors?.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-invalid={!!state.fieldErrors?.password}
              aria-describedby="password-hint"
            />
            {state.fieldErrors?.password ? (
              <FieldError id="password-hint" errors={errs("password")} />
            ) : (
              <FieldDescription id="password-hint">At least 8 characters.</FieldDescription>
            )}
          </Field>
        </FieldGroup>
        <SubmitButton className="w-full" size="lg" pendingText="Creating your account">
          Create account
        </SubmitButton>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
