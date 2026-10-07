"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircleIcon, CircleIcon, EnvelopeOpenIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { AUTH_BUTTON, AUTH_INPUT, AuthHeading, PlanChip, SignupSteps, parsePaidPlan } from "@/components/auth/signup-steps";
import { SubmitButton } from "@/components/submit-button";
import { initialFormState } from "@/lib/form-state";
import { signUp } from "../actions";

export function SignupForm() {
  const searchParams = useSearchParams();
  const plan = parsePaidPlan(searchParams.get("plan"));
  // An invite or deep link sets next; otherwise a picked plan rides along to studio setup.
  const next = searchParams.get("next") ?? (plan ? `/onboarding?plan=${plan}` : "");
  // Clients arrive from an invite: they're joining someone's studio, not starting one.
  const invited = next.startsWith("/invite/");
  const presetEmail = searchParams.get("email") ?? "";
  const [state, action] = useActionState(signUp, initialFormState);
  const [passwordLength, setPasswordLength] = useState(0);
  const longEnough = passwordLength >= 8;

  const heading = invited ? (
    <AuthHeading title="Create your account.">One account for reviewing and approving the work shared with you. Free, always.</AuthHeading>
  ) : (
    <AuthHeading title="Start your studio.">Free for your first 2 clients. Your clients never pay.</AuthHeading>
  );

  if (state.success) {
    return (
      <Alert>
        <EnvelopeOpenIcon />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          {state.success} The link brings you straight back here to set up your studio{plan ? " and check out" : ""}.
        </AlertDescription>
      </Alert>
    );
  }

  const errs = (key: string) => state.fieldErrors?.[key]?.map((message) => ({ message }));

  return (
    <div className="space-y-6">
      <div className="mb-8">{heading}</div>
      {!searchParams.get("next") && <SignupSteps current={1} paid={!!plan} />}
      {plan && <PlanChip plan={plan} note="Set up your studio first. You check out at the end." />}
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
              className={AUTH_INPUT}
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
              className={AUTH_INPUT}
            />
            <FieldError errors={errs("email")} />
          </Field>
          <Field data-invalid={!!state.fieldErrors?.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-invalid={!!state.fieldErrors?.password}
              aria-describedby="password-hint"
              onChange={(e) => setPasswordLength(e.currentTarget.value.length)}
              className={AUTH_INPUT}
            />
            {state.fieldErrors?.password && !longEnough ? (
              <FieldError id="password-hint" errors={errs("password")} />
            ) : (
              <FieldDescription id="password-hint" className={cn("flex items-center gap-1.5", longEnough && "text-status-approved")}>
                {longEnough ? <CheckCircleIcon weight="fill" className="size-4" aria-hidden="true" /> : <CircleIcon className="size-4" aria-hidden="true" />}
                At least 8 characters
              </FieldDescription>
            )}
          </Field>
        </FieldGroup>
        <SubmitButton className={AUTH_BUTTON} size="lg" pendingText="Creating your account">
          Create account
        </SubmitButton>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-semibold text-foreground underline underline-offset-4 hover:text-ink/70"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
