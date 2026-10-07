"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { AUTH_BUTTON, AUTH_INPUT, PlanChip, SignupSteps, parsePaidPlan } from "@/components/auth/signup-steps";
import { initialFormState } from "@/lib/form-state";
import { LogoMark } from "@/components/brand/logo";
import { createWorkspace } from "./actions";

export function OnboardingForm({ heading }: { heading: React.ReactNode }) {
  const plan = parsePaidPlan(useSearchParams().get("plan"));
  const [state, action] = useActionState(createWorkspace, initialFormState);
  const [name, setName] = useState(state.values?.name ?? "");
  const shown = name.trim() || "Your studio";

  return (
    <div className="space-y-8">
      <SignupSteps current={2} paid={!!plan} />
      {heading}
      <form action={action} noValidate className="space-y-5">
        <input type="hidden" name="plan" value={plan ?? ""} />
        {state.error && (
          <Alert variant="destructive">
            <WarningCircleIcon />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Field data-invalid={!!state.fieldErrors?.name}>
          <FieldLabel htmlFor="name">Studio name</FieldLabel>
          <Input
            id="name"
            name="name"
            placeholder="Kestrel Studio"
            autoComplete="organization"
            autoFocus
            required
            maxLength={60}
            defaultValue={state.values?.name}
            onChange={(e) => setName(e.currentTarget.value)}
            aria-invalid={!!state.fieldErrors?.name}
            className={AUTH_INPUT}
          />
          <FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} />
        </Field>

        {/* A live look at the header every client sees, so the name's job is obvious. */}
        <figure className="rounded-2xl border border-dashed border-ink/20 p-3">
          <figcaption className="px-1 pb-2 text-xs font-semibold text-ink/65">What your clients see</figcaption>
          <div aria-hidden="true" className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-[0_10px_24px_-18px_rgb(21_23_26/0.5)]">
            <LogoMark className="size-8 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Northwind Coffee</p>
              <p className="truncate text-xs text-ink/60">
                with <span className="font-semibold text-ink">{shown}</span>
              </p>
            </div>
            <span className="ml-auto grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">DO</span>
          </div>
        </figure>

        {plan && <PlanChip plan={plan} note="Next: check out in Stripe test mode. Or skip and stay on Free." />}

        <SubmitButton className={AUTH_BUTTON} size="lg" pendingText="Setting up your studio">
          {plan ? "Create studio and continue" : "Create studio"}
        </SubmitButton>
      </form>
    </div>
  );
}
