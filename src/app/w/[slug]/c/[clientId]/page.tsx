import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircleIcon, TrayIcon, UserPlusIcon } from "@phosphor-icons/react/ssr";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { DeliverableRow } from "@/components/deliverable-row";
import { ActivityFeed } from "@/components/activity-feed";
import { NewDeliverableDialog } from "@/components/uploads/new-deliverable-dialog";
import { initials } from "@/components/initials";
import { getProfile, getWorkspaceContext } from "@/lib/data/workspace";
import { ACCENT_SWATCH, getClientSpace } from "@/lib/data/clients";
import { getClientDeliverables, type DeliverableRow as Row } from "@/lib/data/deliverables";
import { getActivity } from "@/lib/data/activity";
import { currentTime } from "@/lib/now";
import { firstName } from "@/lib/format";

export const metadata: Metadata = { title: "Client" };

export default function ClientSpacePage({ params }: PageProps<"/w/[slug]/c/[clientId]">) {
  return (
    <Suspense fallback={<ClientSkeleton />}>
      <ClientSpace params={params} />
    </Suspense>
  );
}

async function ClientSpace({ params }: { params: Promise<{ slug: string; clientId: string }> }) {
  const { slug, clientId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(clientId)) notFound();
  const ws = await getWorkspaceContext(slug);
  const [now, client, deliverables, activity] = await Promise.all([
    currentTime(),
    getClientSpace(ws.id, clientId),
    getClientDeliverables(ws.id, clientId),
    getActivity(ws.id, { clientId, limit: 10 }),
  ]);
  if (!client) notFound();

  if (!ws.isTeam) {
    const profile = await getProfile();
    return <ClientPortal slug={slug} name={profile.fullName} agency={ws.name} deliverables={deliverables} now={now} />;
  }

  const by = (s: Row["status"]) => deliverables.filter((d) => d.status === s);
  const tabs = [
    { value: "all", label: "All", items: deliverables },
    { value: "in_review", label: "Waiting on client", items: by("in_review") },
    { value: "changes_requested", label: "Changes requested", items: by("changes_requested") },
    { value: "approved", label: "Approved", items: by("approved") },
    { value: "draft", label: "Drafts", items: by("draft") },
  ];
  const clientPeople = client.people.filter((p) => p.role === "client");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Client"
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className={cn("size-3 rounded-full", ACCENT_SWATCH[client.accent])} aria-hidden="true" />
            {client.name}
          </span>
        }
        description={`${deliverables.length} ${deliverables.length === 1 ? "deliverable" : "deliverables"}, ${clientPeople.length} ${
          clientPeople.length === 1 ? "person" : "people"
        } from ${client.name} with access`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/w/${slug}/team?invite=client&client=${client.id}`}>
                <UserPlusIcon />
                Invite client
              </Link>
            </Button>
            <NewDeliverableDialog slug={slug} clientId={client.id} clientName={client.name} isDemo={ws.isDemo} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {deliverables.length === 0 ? (
          <Empty className="rounded-xl border border-dashed bg-card py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TrayIcon />
              </EmptyMedia>
              <EmptyTitle>No deliverables yet</EmptyTitle>
              <EmptyDescription>
                Upload the first file for {client.name}. They&apos;ll see it as soon as you ask for approval.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Tabs defaultValue="all" className="gap-4">
            <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
              {tabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                  {t.label}
                  <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground tabular">{t.items.length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((t) => (
              <TabsContent key={t.value} value={t.value}>
                <Card className="gap-0 py-0">
                  {t.items.length ? (
                    <ul className="divide-y">
                      {t.items.map((d) => (
                        <DeliverableRow key={d.id} d={d} slug={slug} audience="team" showClient={false} showNote={t.value === "changes_requested"} now={now} />
                      ))}
                    </ul>
                  ) : (
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">Nothing here.</CardContent>
                  )}
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="space-y-6">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>People with access</CardTitle>
              <CardDescription>Clients only see this space.</CardDescription>
            </CardHeader>
            <CardContent className="py-3">
              {clientPeople.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  No one from {client.name} yet.{" "}
                  <Link href={`/w/${slug}/team?invite=client&client=${client.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    Invite them
                  </Link>
                </p>
              ) : (
                <ul className="space-y-2">
                  {clientPeople.map((p) => (
                    <li key={p.userId} className="flex items-center gap-2.5 text-sm">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[11px]">{initials(p.name)}</AvatarFallback>
                      </Avatar>
                      {p.name}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ActivityFeed items={activity} slug={slug} now={now} showClient={false} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** What a client sees: their turn first, then work in progress, then approved work. */
function ClientPortal({
  slug,
  name,
  agency,
  deliverables,
  now,
}: {
  slug: string;
  name: string;
  agency: string;
  deliverables: Row[];
  now: number;
}) {
  const yourTurn = deliverables.filter((d) => d.status === "in_review");
  const withTeam = deliverables.filter((d) => d.status === "changes_requested");
  const approved = deliverables.filter((d) => d.status === "approved");

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Hi {firstName(name)}</h1>
        <p className="text-sm text-muted-foreground">
          {yourTurn.length
            ? `${agency} is waiting on ${yourTurn.length === 1 ? "one thing" : `${yourTurn.length} things`} from you.`
            : "You're all caught up."}
        </p>
      </div>

      <section aria-labelledby="your-turn" className="space-y-3">
        <h2 id="your-turn" className="text-sm font-semibold">
          Waiting for you
        </h2>
        {yourTurn.length ? (
          <Card className="gap-0 py-0">
            <ul className="divide-y">
              {yourTurn.map((d) => (
                <DeliverableRow key={d.id} d={d} slug={slug} audience="client" showClient={false} now={now} />
              ))}
            </ul>
          </Card>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            <CheckCircleIcon className="size-5 text-status-approved" aria-hidden="true" />
            Nothing needs your review right now. New work will show up here.
          </div>
        )}
      </section>

      {withTeam.length > 0 && (
        <section aria-labelledby="with-team" className="space-y-3">
          <h2 id="with-team" className="text-sm font-semibold">
            With {agency}
          </h2>
          <Card className="gap-0 py-0">
            <ul className="divide-y">
              {withTeam.map((d) => (
                <DeliverableRow key={d.id} d={d} slug={slug} audience="client" showClient={false} showNote now={now} />
              ))}
            </ul>
          </Card>
        </section>
      )}

      {approved.length > 0 && (
        <section aria-labelledby="approved" className="space-y-3">
          <h2 id="approved" className="text-sm font-semibold">
            Approved
          </h2>
          <Card className="gap-0 py-0">
            <ul className="divide-y">
              {approved.map((d) => (
                <DeliverableRow key={d.id} d={d} slug={slug} audience="client" showClient={false} now={now} />
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}

function ClientSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
