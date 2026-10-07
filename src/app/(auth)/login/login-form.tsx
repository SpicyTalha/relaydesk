"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
            <AlertCircle />
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
            />
            <FieldError errors={state.fieldErrors?.email?.map((message) => ({ message }))} />
          </Field>
          <Field data-invalid={!!state.fieldErrors?.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={!!state.fieldErrors?.password}
            />
            <FieldError errors={state.fieldErrors?.password?.map((message) => ({ message }))} />
          </Field>
        </FieldGroup>
        <SubmitButton className="w-full" size="lg" pendingText="Signing in">
          Sign in
        </SubmitButton>
      </form>

      <DemoAccess next={next} />

      <p className="text-center text-sm text-muted-foreground">
        New to Relaydesk?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create a workspace
        </Link>
      </p>
    </div>
  );
}
