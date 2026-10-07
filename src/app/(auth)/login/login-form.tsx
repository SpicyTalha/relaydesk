"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { AUTH_BUTTON, AUTH_INPUT } from "@/components/auth/signup-steps";
import { SubmitButton } from "@/components/submit-button";
import { initialFormState } from "@/lib/form-state";
import { signIn } from "../actions";
import { DemoAccess } from "../demo-access";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const linkError = searchParams.get("error") === "link";
  const [state, action] = useActionState(signIn, initialFormState);

  const error = state.error ?? (linkError ? "That link has expired or was already used. Sign in instead." : undefined);

  return (
    <div className="space-y-6">
      <form action={action} noValidate className="space-y-5">
        <input type="hidden" name="next" value={next} />
        {error && (
          <Alert variant="destructive">
            <WarningCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FieldGroup className="gap-4">
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
          <Field data-invalid={!!state.fieldErrors?.password}>
            <div className="flex items-baseline justify-between gap-3">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link href="/forgot-password" className="rounded-sm text-sm font-medium text-ink/65 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              aria-invalid={!!state.fieldErrors?.password}
              className={AUTH_INPUT}
            />
            <FieldError errors={state.fieldErrors?.password?.map((message) => ({ message }))} />
          </Field>
        </FieldGroup>
        <SubmitButton className={AUTH_BUTTON} size="lg" pendingText="Signing in">
          Sign in
        </SubmitButton>
      </form>

      <DemoAccess next={next} />

      <p className="text-center text-sm text-muted-foreground">
        New to Relaydesk?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-semibold text-foreground underline underline-offset-4 hover:text-ink/70"
        >
          Create your studio
        </Link>
      </p>
    </div>
  );
}
