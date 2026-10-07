"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOutIcon, CheckCircleIcon, CreditCardIcon } from "@phosphor-icons/react";
import { SubmitButton } from "@/components/submit-button";
import { Spinner } from "@/components/ui/spinner";
import { initialFormState } from "@/lib/form-state";
import { openPortal, startCheckout } from "@/lib/actions/billing";

export function UpgradeButton({ slug, plan, label }: { slug: string; plan: "pro" | "studio"; label: string }) {
  const [state, action] = useActionState(startCheckout, initialFormState);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="plan" value={plan} />
      <SubmitButton className="w-full" pendingText="Opening checkout">
        {label}
      </SubmitButton>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

export function ManageBillingButton({ slug }: { slug: string }) {
  const [state, action] = useActionState(openPortal, initialFormState);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <SubmitButton variant="outline" pendingText="Opening billing">
        <CreditCardIcon />
        Manage billing
        <ArrowSquareOutIcon className="opacity-60" />
      </SubmitButton>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

/**
 * After Checkout, the plan changes only when Stripe's webhook arrives (usually within seconds).
 * Re-fetch the page every 2 seconds until the server shows the new plan, for up to 40 seconds.
 */
export function ConfirmingPlan({ confirmed, planName }: { confirmed: boolean; planName: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const tries = useRef(0);

  useEffect(() => {
    if (confirmed) return;
    const timer = setInterval(() => {
      tries.current += 1;
      if (tries.current > 20) {
        clearInterval(timer);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, 2000);
    return () => clearInterval(timer);
  }, [confirmed, router]);

  if (confirmed) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-xl border border-status-approved/30 bg-status-approved/10 p-4 text-sm">
        <CheckCircleIcon className="size-5 text-status-approved" aria-hidden="true" />
        <span>
          Payment confirmed. You&apos;re on <span className="font-semibold">{planName}</span>.
        </span>
      </div>
    );
  }
  return (
    <div role="status" className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
      {timedOut ? null : <Spinner />}
      <span>
        {timedOut
          ? "Stripe hasn't confirmed the payment yet. Refresh in a minute; if nothing changes, your card was not charged."
          : "Confirming your payment with Stripe. This usually takes a few seconds."}
      </span>
    </div>
  );
}
