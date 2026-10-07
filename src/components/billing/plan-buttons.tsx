"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOutIcon, CheckCircleIcon, CreditCardIcon } from "@phosphor-icons/react";
import { SubmitButton } from "@/components/submit-button";
import { Spinner } from "@/components/ui/spinner";
import { initialFormState } from "@/lib/form-state";
import { openPortal, startCheckout, syncBilling } from "@/lib/actions/billing";

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
 * Back from Checkout: ask Stripe for the subscription straight away (syncBilling), then re-fetch
 * the page every 2 seconds until it shows the new plan, for up to 40 seconds. The webhook confirms
 * the same state independently.
 */
export function ConfirmingPlan({ confirmed, planName, slug }: { confirmed: boolean; planName: string; slug: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const tries = useRef(0);

  useEffect(() => {
    if (confirmed) return;
    let cancelled = false;
    void syncBilling({ slug, reason: "checkout_return" }).then(() => !cancelled && router.refresh());
    const timer = setInterval(() => {
      tries.current += 1;
      if (tries.current > 20) {
        clearInterval(timer);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [confirmed, router, slug]);

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

/** Back from the billing portal (plan change, cancellation): pull the new state once, then tidy the URL. */
export function SyncOnPortalReturn({ slug }: { slug: string }) {
  const router = useRouter();
  useEffect(() => {
    void syncBilling({ slug, reason: "portal_return" }).then(() => {
      router.replace(`/w/${slug}/billing`, { scroll: false });
      router.refresh();
    });
  }, [router, slug]);
  return null;
}
