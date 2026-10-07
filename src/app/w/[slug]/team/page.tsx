import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { EnvelopeIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { InviteDialog } from "@/components/team/invite-dialog";
import { MemberActions, RevokeInviteButton } from "@/components/team/member-actions";
import { initials } from "@/components/initials";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { getClientSpaces } from "@/lib/data/clients";
import { getTeam, type Member } from "@/lib/data/team";
import { currentTime } from "@/lib/now";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Team" };

const ROLE_LABEL = { owner: "Owner", member: "Teammate", client: "Client" } as const;

export default function TeamPage({ params, searchParams }: PageProps<"/w/[slug]/team">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-4xl" />}>
      <Team params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Team({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const ws = await getWorkspaceContext(slug);
  if (!ws.isTeam) redirect(`/w/${slug}`);

  const [now, clients, { members, invites }] = await Promise.all([currentTime(), getClientSpaces(ws.id), getTeam(ws.id)]);
  const team = members.filter((m) => m.role !== "client");
  const clientUsers = members.filter((m) => m.role === "client");
  const presetClient = typeof query.client === "string" && clients.some((c) => c.id === query.client) ? query.client : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Team"
        description="Your teammates see every client. Client users only see their own space."
        actions={
          <InviteDialog
            slug={slug}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
            canInviteTeam={ws.isOwner}
            defaultOpen={query.invite === "client" || query.invite === "member"}
            defaultRole={query.invite === "member" ? "member" : "client"}
            defaultClientId={presetClient}
          />
        }
      />

      <MemberCard
        title="Agency team"
        description={`${team.length} ${team.length === 1 ? "person" : "people"}`}
        members={team}
        slug={slug}
        canManage={ws.isOwner}
        selfId={ws.userId}
        now={now}
      />
      <MemberCard
        title="Client users"
        description="People from your clients who can review work."
        members={clientUsers}
        slug={slug}
        canManage={ws.isOwner}
        selfId={ws.userId}
        now={now}
        empty="No client users yet. Invite someone from a client to start collecting approvals."
      />

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Pending invitations</CardTitle>
          <CardDescription>Links expire 7 days after they&apos;re created.</CardDescription>
        </CardHeader>
        {invites.length === 0 ? (
          <p className="px-6 py-6 text-sm text-muted-foreground">No pending invitations.</p>
        ) : (
          <ul className="divide-y">
            {invites.map((i) => {
              const expired = Date.parse(i.expiresAt) < now;
              return (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <EnvelopeIcon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABEL[i.role]}
                      {i.clientName ? `, ${i.clientName}` : ""}. {expired ? "Expired" : `Sent ${timeAgo(i.createdAt, now)}`}
                    </p>
                  </div>
                  {expired && <Badge variant="secondary">Expired</Badge>}
                  <RevokeInviteButton slug={slug} invitationId={i.id} email={i.email} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MemberCard({
  title,
  description,
  members,
  slug,
  canManage,
  selfId,
  now,
  empty,
}: {
  title: string;
  description: string;
  members: Member[];
  slug: string;
  canManage: boolean;
  selfId: string;
  now: number;
  empty?: string;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {members.length === 0 ? (
        <p className="px-6 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y">
          {members.map((m) => (
            <li key={m.membershipId} className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <Avatar className="size-8">
                <AvatarFallback className="text-[11px] font-semibold">{initials(m.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name}
                  {m.userId === selfId && <span className="font-normal text-muted-foreground"> (you)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.clientName ? `${m.clientName}, joined ` : "Joined "}{timeAgo(m.joinedAt, now)}
                </p>
              </div>
              <Badge variant={m.role === "owner" ? "default" : "secondary"}>{ROLE_LABEL[m.role]}</Badge>
              {canManage && m.userId !== selfId ? (
                <MemberActions slug={slug} membershipId={m.membershipId} name={m.name} role={m.role} />
              ) : (
                <span className="w-7" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
