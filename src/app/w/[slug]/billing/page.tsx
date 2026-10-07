import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CheckIcon, FlaskIcon, ShieldWarningIcon } from "@phosphor-icons/react/ssr";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SignupSteps, parsePaidPlan } from "@/components/auth/signup-steps";
import { ConfirmingPlan, ManageBillingButton, UpgradeButton } from "@/components/billing/plan-buttons";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { getBilling } from "@/lib/data/billing";
import { PLANS, planById } from "@/lib/billing/plans";
import { formatBytes, shortDate } from "@/lib/format";
import { currentTime } from "@/lib/now";

export const metadata: Metadata = { title: "Billing" };

const STATUS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment failed, retrying",
  canceled: "Canceled",
  unpaid: "Unpaid",
  incomplete: "Incomplete",
};

export default function BillingPage({ params, searchParams }: PageProps<"/w/[slug]/billing">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[36rem] max-w-5xl" />}>
      <Billing params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Billing({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const ws = await getWorkspaceContext(slug);
  if (!ws.isOwner) redirect(`/w/${slug}`);

  const [now, { subscription, usage }] = await Promise.all([currentTime(), getBilling(ws.id)]);
  const current = planById(ws.plan);
  const hasSubscription = !!subscription && ["active", "trialing", "past_due"].includes(subscription.status);
  // A paid plan picked on the pricing page during sign-up, still waiting for checkout.
  const pickedId = parsePaidPlan(typeof query.plan === "string" ? query.plan : null);
  const picked = pickedId && ws.plan === "free" && !hasSubscription && !query.checkout ? planById(pickedId) : null;

  const meters = [
    { label: "Client spaces", used: usage.clients, limit: current.limits.clients, format: String },
    { label: "Team seats", used: usage.team, limit: current.limits.team, format: String },
    { label: "Storage", used: usage.storageBytes, limit: current.limits.storageBytes, format: formatBytes },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Billing" description="Plans, usage and invoices for this studio." actions={hasSubscription && <ManageBillingButton slug={slug} />} />

      {picked && (
        <section aria-labelledby="finish-title" className="relative overflow-hidden rounded-2xl bg-process-yellow p-6 text-ink sm:p-8">
          <div aria-hidden="true" className="halftone pointer-events-none absolute inset-0 text-ink/15" />
          <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_16rem] md:items-end">
            <div className="space-y-4">
              <SignupSteps current={3} paid />
              <h2 id="finish-title" className="font-display text-3xl leading-tight font-extrabold tracking-[-0.04em]">
                One step left: switch on {picked.name}.
              </h2>
              <p className="max-w-lg text-ink/75">
                ${picked.price} a month for {picked.features
                  .slice(0, 3)
                  .map((f) => f.charAt(0).toLowerCase() + f.slice(1))
                  .join(", ")}. Your studio already works on Free, so you
                can also do this later.
              </p>
            </div>
            <div className="space-y-3">
              <UpgradeButton slug={slug} plan={picked.id as "pro" | "studio"} label={`Check out ${picked.name}`} />
              <Link
                href={`/w/${slug}`}
                className="block rounded-md text-center text-sm font-semibold underline underline-offset-4 outline-none hover:text-ink/70 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Skip for now
              </Link>
            </div>
          </div>
        </section>
      )}

      {query.checkout === "success" && <ConfirmingPlan confirmed={ws.plan !== "free"} planName={current.name} />}
      {query.checkout === "canceled" && (
        <p role="status" className="rounded-xl border bg-muted/40 p-4 text-sm">
          Checkout was canceled. Nothing was charged.
        </p>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <FlaskIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Payments run in Stripe test mode. Use the card <span className="font-mono text-foreground">4242 4242 4242 4242</span> with any
          future date and any CVC. No real money moves.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader>
            <CardDescription>Current plan</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {current.name}
              {subscription && subscription.status !== "none" && (
                <Badge variant={subscription.status === "past_due" ? "destructive" : "secondary"}>{STATUS[subscription.status] ?? subscription.status}</Badge>
              )}
            </CardTitle>
            {hasSubscription && subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancel_at_period_end ? "Ends" : "Renews"} on {shortDate(subscription.current_period_end, now)}, ${current.price} a month
              </p>
            )}
            {!hasSubscription && (
              <p className="text-sm text-muted-foreground">
                Upgrade when you need more client spaces, seats or storage. Your data stays exactly where it is.
              </p>
            )}
          </CardHeader>
          {subscription?.status === "past_due" && (
            <CardContent>
              <p className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldWarningIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Your last payment failed. Stripe will retry; update your card in Manage billing to keep {current.name}.
              </p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {meters.map((m) => {
              const pct = m.limit ? Math.min(100, Math.round((m.used / m.limit) * 100)) : 0;
              return (
                <div key={m.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{m.label}</span>
                    <span className="text-muted-foreground tabular">
                      {m.format(m.used)} {m.limit ? `of ${m.format(m.limit)}` : "(unlimited)"}
                    </span>
                  </div>
                  {m.limit !== null && (
                    <Progress value={pct} aria-label={`${m.label} used`} className={cn(pct >= 90 && "[&>[data-slot=progress-indicator]]:bg-status-changes")} />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="plans" className="space-y-4">
        <h2 id="plans" className="font-semibold">
          Plans
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.id === ws.plan;
            return (
              <Card key={p.id} className={cn(isCurrent && "border-primary ring-1 ring-primary", picked?.id === p.id && "ring-2 ring-process-magenta")}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {p.name}
                    {isCurrent && <Badge>Current</Badge>}
                  </CardTitle>
                  <p className="text-3xl font-semibold tracking-tight tabular">
                    ${p.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <CardDescription>{p.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-status-approved" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <p className="text-sm text-muted-foreground">You&apos;re on this plan.</p>
                  ) : p.id === "free" ? (
                    hasSubscription ? <p className="text-sm text-muted-foreground">Cancel in Manage billing to move back to Free.</p> : null
                  ) : hasSubscription ? (
                    <ManageBillingButton slug={slug} />
                  ) : (
                    <div className="w-full">
                      <UpgradeButton slug={slug} plan={p.id as "pro" | "studio"} label={`Upgrade to ${p.name}`} />
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
