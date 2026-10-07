import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CheckCircleIcon, ClockIcon, FolderPlusIcon, PaperPlaneTiltIcon, PencilLineIcon, UploadSimpleIcon, UserPlusIcon, WarningIcon } from "@phosphor-icons/react/ssr";
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

  if (clients.length === 0) return <GettingStarted slug={slug} name={profile.fullName} />;

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

function GettingStarted({ slug, name }: { slug: string; name: string }) {
  const steps = [
    { icon: FolderPlusIcon, title: "Add your first client", body: "Each client gets a private space that only they and your team can see." },
    { icon: UploadSimpleIcon, title: "Upload a deliverable", body: "Logos, ads, PDFs, videos. Every upload becomes a new version." },
    { icon: PaperPlaneTiltIcon, title: "Ask for approval", body: "Your client approves or asks for changes, from any device." },
    { icon: UserPlusIcon, title: "Invite your client", body: "Send them a link. They only ever see their own work." },
  ];
  return (
    <div className="mx-auto max-w-2xl py-6">
      <PageHeader title={`Welcome, ${firstName(name)}`} description="Four steps and your first approval is on its way." />
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li
            key={s.title}
            aria-current={i === 0 ? "step" : undefined}
            className={cn("flex gap-4 rounded-xl border bg-card p-4", i === 0 && "border-ink shadow-[0_14px_30px_-22px_rgb(21_23_26/0.6)]")}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold tabular",
                i === 0 ? "bg-process-yellow text-ink ring-2 ring-ink" : "border text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("font-medium", i > 0 && "text-foreground/70")}>{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.body}</p>
              {i === 0 && (
                <div className="mt-3">
                  <AddClientDialog slug={slug} />
                </div>
              )}
            </div>
            <s.icon className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </li>
        ))}
      </ol>
    </div>
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
