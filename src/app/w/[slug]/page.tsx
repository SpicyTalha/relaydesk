import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircleIcon, CheckIcon, ClockIcon, FolderPlusIcon, PaperPlaneTiltIcon, PencilLineIcon, UploadSimpleIcon, UserPlusIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { cn } from "cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { DeliverableRow } from "@/components/deliverable-row";
import { ActivityFeed } from "@/components/activity-feed";
import { AddClientDialog } from "@/components/shell/add-client-dialog";
import { getProfile, getWorkspaceContext } from "@/lib/data/workspace";
import { getClientSpaces } from "@/lib/data/clients";
import { countApprovedSince, getOpenDeliverables } from "@/lib/data/deliverables";
import { getActivity } from "@/lib/data/activity";
import { dueInfo, firstName } from "@/lib/format";
import { currentTime } from "@/lib/now";
import { getSetupProgress, type SetupProgress } from "@/lib/data/setup";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage({ params }: PageProps<"/w/[slug]">) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ws = await getWorkspaceContext(slug);
  if (!ws.isTeam) redirect(`/w/${slug}/c/${ws.clientId}`);

  const [now, profile, clients, open, approved30, activity] = await Promise.all([
    currentTime(),
    getProfile(),
    getClientSpaces(ws.id),
    getOpenDeliverables(ws.id),
    countApprovedSince(ws.id, 30),
    getActivity(ws.id, { limit: 12 }),
  ]);
  // Real studios see the setup checklist until the first client is invited; demo copies start finished.
  const setup = ws.isDemo ? null : await getSetupProgress(ws.id, slug);

  if (clients.length === 0) return <GettingStarted slug={slug} name={profile.fullName} setup={setup} />;

  const waiting = open.filter((d) => d.status === "in_review");
  const changes = open.filter((d) => d.status === "changes_requested");
  const overdue = waiting.filter((d) => dueInfo(d.dueOn, now)?.tone === "overdue");

  const stats = [
    { label: "Waiting on clients", value: waiting.length, icon: ClockIcon, tone: "text-status-review", bar: "bg-status-review" },
    {
      label: "Overdue",
      value: overdue.length,
      icon: WarningIcon,
      tone: overdue.length ? "text-pen" : "text-muted-foreground",
      bar: overdue.length ? "bg-pen" : "bg-ink/15",
    },
    { label: "Changes requested", value: changes.length, icon: PencilLineIcon, tone: "text-status-changes", bar: "bg-status-changes" },
    { label: "Approved, last 30 days", value: approved30, icon: CheckCircleIcon, tone: "text-status-approved", bar: "bg-status-approved" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Welcome back, ${firstName(profile.fullName)}`}
        description="Here's what's moving across your clients."
        actions={<AddClientDialog slug={slug} />}
      />

      {setup && setup.done < setup.steps.length && (
        <section aria-labelledby="setup-title" className="mb-10 rounded-2xl border border-ink bg-card p-5 shadow-[5px_5px_0_var(--color-process-yellow)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="setup-title" className="font-display text-xl font-extrabold tracking-[-0.02em]">
              Finish setting up
            </h2>
            <p className="text-sm text-muted-foreground tabular">
              {setup.done} of {setup.steps.length} done
            </p>
          </div>
          <SetupSteps slug={slug} setup={setup} compact />
        </section>
      )}

      <dl className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-xl bg-card p-4 pt-5 shadow-[0_0_0_1px_rgb(21_23_26/0.07),0_14px_30px_-24px_rgb(21_23_26/0.55)]"
          >
            <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-1.5", s.bar)} />
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <s.icon className={cn("size-4", s.tone)} aria-hidden="true" />
              {s.label}
            </dt>
            <dd className="mt-2 font-display text-5xl leading-none font-extrabold tracking-[-0.05em] tabular">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Back to you</CardTitle>
              <CardDescription>Clients asked for changes. Upload a new version when it&apos;s ready.</CardDescription>
            </CardHeader>
            {changes.length ? (
              <ul className="divide-y">
                {changes.map((d) => (
                  <DeliverableRow key={d.id} d={d} slug={slug} audience="team" showNote now={now} />
                ))}
              </ul>
            ) : (
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No change requests. Nice.
              </CardContent>
            )}
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Waiting on clients</CardTitle>
              <CardDescription>Sorted by due date. Overdue items are at the top.</CardDescription>
            </CardHeader>
            {waiting.length ? (
              <ul className="divide-y">
                {waiting.map((d) => (
                  <DeliverableRow key={d.id} d={d} slug={slug} audience="team" now={now} />
                ))}
              </ul>
            ) : (
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nothing is waiting on a client right now.
              </CardContent>
            )}
          </Card>
        </div>

        <Card className="h-fit gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ActivityFeed items={activity} slug={slug} now={now} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GettingStarted({ slug, name, setup }: { slug: string; name: string; setup: SetupProgress | null }) {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <PageHeader title={`Welcome, ${firstName(name)}`} description="Four steps and your first approval is on its way." />
      <SetupSteps slug={slug} setup={setup} />
    </div>
  );
}

const STEPS = {
  client: { icon: FolderPlusIcon, title: "Add your first client", body: "Each client gets a private space that only they and your team can see.", cta: null },
  upload: { icon: UploadSimpleIcon, title: "Upload a deliverable", body: "Logos, ads, PDFs, videos. Every upload becomes a new version.", cta: "Open the client and add a deliverable" },
  approval: { icon: PaperPlaneTiltIcon, title: "Ask for approval", body: "Set a due date; your client approves or asks for changes, from any device.", cta: "Open it and ask for approval" },
  invite: { icon: UserPlusIcon, title: "Invite your client", body: "Send them a link. They only ever see their own work.", cta: "Invite them from their space" },
} as const;

/** The four steps to a first approval, ticked off from what the studio has really done. */
function SetupSteps({ slug, setup, compact = false }: { slug: string; setup: SetupProgress | null; compact?: boolean }) {
  const steps = setup?.steps ?? (["client", "upload", "approval", "invite"] as const).map((key) => ({ key, done: false, href: null }));
  const current = steps.findIndex((s) => !s.done);
  return (
    <ol className={cn("gap-3", compact ? "grid sm:grid-cols-2 lg:grid-cols-4" : "space-y-3")}>
      {steps.map((step, i) => {
        const s = STEPS[step.key];
        const isCurrent = i === current;
        return (
          <li
            key={step.key}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex gap-3 rounded-xl border bg-card p-4",
              isCurrent && "border-ink shadow-[0_14px_30px_-22px_rgb(21_23_26/0.6)]",
              step.done && "bg-muted/40",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold tabular",
                step.done ? "bg-status-approved text-white" : isCurrent ? "bg-process-yellow text-ink ring-2 ring-ink" : "border text-muted-foreground",
              )}
            >
              {step.done ? <CheckIcon weight="bold" className="size-4" aria-label="Done" /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("font-medium", step.done && "text-muted-foreground line-through", !step.done && !isCurrent && "text-foreground/70")}>{s.title}</p>
              {!compact && <p className="text-sm text-muted-foreground">{s.body}</p>}
              {isCurrent && step.key === "client" && (
                <div className="mt-3">
                  <AddClientDialog slug={slug} />
                </div>
              )}
              {isCurrent && step.href && s.cta && (
                <Link href={step.href} className="mt-2 inline-block text-sm font-semibold underline underline-offset-4 hover:text-foreground/70">
                  {s.cta}
                </Link>
              )}
            </div>
            {!compact && <s.icon className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
