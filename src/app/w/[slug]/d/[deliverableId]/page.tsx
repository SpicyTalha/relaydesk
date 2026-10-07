import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowsLeftRightIcon,
  CalendarDotsIcon,
  CaretLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  FileArrowUpIcon,
  PencilLineIcon,
  PushPinIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";
import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatusBadge } from "@/components/status-badge";
import { FilePreview } from "@/components/deliverable/file-preview";
import { StampOverlay } from "@/components/deliverable/stamp-overlay";
import { ReviewPanel } from "@/components/deliverable/review-panel";
import { TeamActions } from "@/components/deliverable/team-actions";
import { CommentComposer, DeleteCommentButton, ResolveButton } from "@/components/deliverable/comment-composer";
import { PinLayer, PinMark } from "@/components/deliverable/pin-layer";
import { CompareSlider } from "@/components/deliverable/compare-slider";
import { ChecklistCard } from "@/components/deliverable/checklist-card";
import { aiAllowance, getLatestChecklist } from "@/lib/data/checklists";
import { initials } from "@/components/initials";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { ACCENT_SWATCH } from "@/lib/data/clients";
import { getDeliverable } from "@/lib/data/deliverables";
import { getComments, pinNumbers } from "@/lib/data/comments";
import { previewKind } from "@/lib/uploads";
import { createClient } from "@/lib/supabase/server";
import { currentTime } from "@/lib/now";
import { dueInfo, shortDate, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Deliverable" };

export default function DeliverablePage({ params, searchParams }: PageProps<"/w/[slug]/d/[deliverableId]">) {
  return (
    <Suspense fallback={<DeliverableSkeleton />}>
      <Deliverable params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Deliverable({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; deliverableId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug, deliverableId }, query] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(deliverableId)) notFound();

  const ws = await getWorkspaceContext(slug);
  const [now, d, comments, checklist, allowance] = await Promise.all([
    currentTime(),
    getDeliverable(ws.id, deliverableId),
    getComments(ws.id, deliverableId),
    ws.isTeam ? getLatestChecklist(ws.id, deliverableId) : Promise.resolve(null),
    ws.isTeam ? aiAllowance(ws) : Promise.resolve({ limit: 0, used: 0, left: 0 }),
  ]);

  const audience = ws.isTeam ? "team" : "client";
  const latest = d.versions[0] ?? null;
  const requested = Number(query.v);
  const shown = d.versions.find((v) => v.version === requested) ?? latest;
  const isLatest = shown?.id === latest?.id;

  const isImage = !!shown && previewKind(shown.mimeType) === "image";
  // Compare wipes between two image versions; by default the one before the version shown.
  const previous = shown ? d.versions.find((v) => v.version < shown.version && previewKind(v.mimeType) === "image") : undefined;
  const against = isImage && query.compare ? d.versions.find((v) => v.version === Number(query.compare) && v.id !== shown!.id) : undefined;
  const comparing = against && previewKind(against.mimeType) === "image" ? against : undefined;

  // Short-lived signed URLs from private storage. Storage RLS decides if this user may read the file.
  let viewUrl: string | null = null;
  let downloadUrl: string | null = null;
  let compareUrl: string | null = null;
  if (shown) {
    const supabase = await createClient();
    const bucket = supabase.storage.from("deliverables");
    const [view, download, other] = await Promise.all([
      bucket.createSignedUrl(shown.storagePath, 60 * 60),
      bucket.createSignedUrl(shown.storagePath, 60 * 60, { download: shown.fileName }),
      comparing ? bucket.createSignedUrl(comparing.storagePath, 60 * 60) : Promise.resolve(null),
    ]);
    viewUrl = view.data?.signedUrl ?? null;
    downloadUrl = download.data?.signedUrl ?? null;
    compareUrl = other?.data?.signedUrl ?? null;
  }

  const pinNo = pinNumbers(comments);
  const pins = comments
    .filter((c) => c.pin && c.versionId === shown?.id)
    .map((c) => ({ id: c.id, n: pinNo.get(c.id)!, x: c.pin!.x, y: c.pin!.y, body: c.body, author: c.authorName, resolved: !!c.resolvedAt }));
  // Open notes: unresolved client feedback and pins on the latest version, which the team works down to
  // zero. Once the work is approved there's nothing left open.
  const openNotes =
    d.status === "approved"
      ? 0
      : comments.filter((c) => !c.deleted && !c.resolvedAt && c.versionId === latest?.id && (c.authorIsClient || c.pin)).length +
        d.reviews.filter((r) => r.decision === "changes_requested" && r.versionId === latest?.id && r.note?.trim()).length;
  const base = `/w/${slug}/d/${d.id}`;
  const shownQuery = shown && shown.id !== latest?.id ? `v=${shown.version}` : "";

  const due = d.status === "in_review" ? dueInfo(d.dueOn, now) : null;
  // The stamp sits on the exact version the client approved, not on later uploads.
  const approval = shown ? d.reviews.find((r) => r.decision === "approved" && r.versionId === shown.id) : undefined;
  const clientCanDecide = !ws.isTeam && d.status === "in_review" && !!latest;
  const backHref = `/w/${slug}/c/${d.client.id}`;

  return (
    <div className={cn("mx-auto max-w-6xl", clientCanDecide && "pb-24 lg:pb-0")}>
      <div className="mb-6 space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <CaretLeftIcon className="size-4" aria-hidden="true" />
          {ws.isTeam ? (
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", ACCENT_SWATCH[d.client.accent])} aria-hidden="true" />
              {d.client.name}
            </span>
          ) : (
            "All work"
          )}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="font-display text-[2rem] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance sm:text-[2.5rem]">{d.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <StatusBadge status={d.status} audience={audience} />
              {latest && <span className="tabular">Version {latest.version}</span>}
              {due && (
                <span className={cn("inline-flex items-center gap-1", due.tone === "overdue" && "text-destructive")}>
                  <CalendarDotsIcon className="size-4" aria-hidden="true" />
                  {due.label}
                </span>
              )}
            </div>
          </div>
          {ws.isTeam && (
            <TeamActions
              slug={slug}
              deliverableId={d.id}
              title={d.title}
              description={d.description}
              dueOn={d.dueOn}
              status={d.status}
              hasVersions={d.versions.length > 0}
              nextVersion={(latest?.version ?? 0) + 1}
              clientName={d.client.name}
              isDemo={ws.isDemo}
            />
          )}
        </div>
        {d.description && <p className="max-w-2xl text-sm whitespace-pre-line text-muted-foreground">{d.description}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {shown ? (
            <section id="file" aria-label="File" className="scroll-mt-20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {d.versions.length > 1 ? (
                  <nav aria-label="Versions" className="flex flex-wrap gap-1.5">
                    {d.versions.map((v) => (
                      <Link
                        key={v.id}
                        href={v.id === latest?.id ? `/w/${slug}/d/${d.id}` : `/w/${slug}/d/${d.id}?v=${v.version}`}
                        scroll={false}
                        aria-current={v.id === shown.id ? "page" : undefined}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium outline-none transition-colors tabular focus-visible:ring-3 focus-visible:ring-ring/50",
                          v.id === shown.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                        )}
                      >
                        v{v.version}
                        {v.id === latest?.id && <span className="ml-1 font-normal opacity-75">latest</span>}
                      </Link>
                    ))}
                  </nav>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-3 text-sm">
                  {isImage && !comparing && (
                    <span className="hidden items-center gap-1.5 text-muted-foreground sm:inline-flex">
                      <PushPinIcon className="size-4 text-pen" aria-hidden="true" />
                      Click the work to pin a note
                    </span>
                  )}
                  {isImage && previous && !comparing && (
                    <Link
                      href={`${base}?${shownQuery ? `${shownQuery}&` : ""}compare=${previous.version}`}
                      scroll={false}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <ArrowsLeftRightIcon className="size-3.5" aria-hidden="true" />
                      Compare with v{previous.version}
                    </Link>
                  )}
                  {comparing && (
                    <Link
                      href={shownQuery ? `${base}?${shownQuery}` : base}
                      scroll={false}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white outline-none hover:bg-ink/85 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <XIcon className="size-3.5" aria-hidden="true" />
                      Stop comparing
                    </Link>
                  )}
                </div>
              </div>
              {isImage && !comparing && (
                <p className="text-sm text-muted-foreground sm:hidden">
                  <PushPinIcon className="mr-1 inline size-4 text-pen" aria-hidden="true" />
                  Tap the work to pin a note.
                </p>
              )}
              {!isLatest && (
                <p className="rounded-lg bg-status-changes/10 px-3 py-2 text-sm text-status-changes">
                  You&apos;re looking at version {shown.version}. The latest is version {latest?.version}.
                </p>
              )}
              {comparing && compareUrl && viewUrl ? (
                <CompareSlider
                  before={comparing.version < shown.version ? { url: compareUrl, label: `v${comparing.version}` } : { url: viewUrl, label: `v${shown.version}` }}
                  after={comparing.version < shown.version ? { url: viewUrl, label: `v${shown.version}` } : { url: compareUrl, label: `v${comparing.version}` }}
                />
              ) : (
                <FilePreview
                  url={viewUrl}
                  downloadUrl={downloadUrl}
                  fileName={shown.fileName}
                  mimeType={shown.mimeType}
                  sizeBytes={shown.sizeBytes}
                  pins={isImage && <PinLayer slug={slug} deliverableId={d.id} versionId={shown.id} pins={pins} canPin />}
                  overlay={
                    approval && (
                      <StampOverlay
                        version={shown.version}
                        date={shortDate(approval.createdAt, now)}
                        fresh={now - Date.parse(approval.createdAt) < 20_000}
                      />
                    )
                  }
                />
              )}
              {shown.note && (
                <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  <span className="font-medium">{shown.uploaderName}:</span> {shown.note}
                </p>
              )}
            </section>
          ) : (
            <Empty className="rounded-xl border border-dashed py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileArrowUpIcon />
                </EmptyMedia>
                <EmptyTitle>No file yet</EmptyTitle>
                <EmptyDescription>Upload the first version, then ask {d.client.name} to approve it.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          <section aria-labelledby="comments-title" className="space-y-4">
            <h2 id="comments-title" className="font-semibold">
              Comments <span className="text-sm font-normal text-muted-foreground tabular">{comments.filter((c) => !c.deleted).length}</span>
              {ws.isTeam && openNotes > 0 && (
                <span className="ml-2 rounded-full bg-pen/10 px-2 py-0.5 text-xs font-semibold text-pen tabular">
                  {openNotes} open {openNotes === 1 ? "note" : "notes"}
                </span>
              )}
            </h2>
            {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet. Questions and feedback go here.</p>}
            <ol className="space-y-4">
              {comments.map((c) => {
                const v = d.versions.find((x) => x.id === c.versionId);
                return (
                  <li
                    key={c.id}
                    id={`comment-${c.id}`}
                    className={cn("-mx-2 flex scroll-mt-24 gap-3 rounded-xl px-2 py-1 target:bg-process-yellow/35", c.resolvedAt && "opacity-70")}
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className={cn("text-[11px] font-semibold", c.authorIsClient ? "bg-status-review/12 text-status-review" : "bg-primary/10 text-primary")}>
                        {initials(c.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <span className="font-medium">{c.authorName}</span>
                        {c.authorIsClient && ws.isTeam && <span className="text-xs text-status-review">Client</span>}
                        <span className="text-xs text-muted-foreground">
                          <time dateTime={c.createdAt}>{timeAgo(c.createdAt, now)}</time>
                        </span>
                        {v && <span className="text-xs text-muted-foreground tabular">on v{v.version}</span>}
                        {c.resolvedAt && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-status-approved">
                            <CheckCircleIcon weight="fill" className="size-3.5" aria-hidden="true" />
                            Resolved
                          </span>
                        )}
                      </p>
                      {c.deleted ? (
                        <p className="mt-1 text-sm text-muted-foreground italic">Comment deleted</p>
                      ) : (
                        <p className="mt-1 flex gap-2 text-sm whitespace-pre-line break-words">
                          {c.pin && pinNo.has(c.id) && (
                            <a
                              href={c.versionId === shown?.id ? "#file" : `${base}?v=${v?.version}`}
                              aria-label={`Pin ${pinNo.get(c.id)} on v${v?.version}`}
                              className="-mt-0.5 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                              <PinMark n={pinNo.get(c.id)!} resolved={!!c.resolvedAt} small />
                            </a>
                          )}
                          <span className="min-w-0">{c.body}</span>
                        </p>
                      )}
                      {!c.deleted && (c.authorId === ws.userId || (ws.isTeam && (c.authorIsClient || c.pin))) && (
                        <div className="mt-1 flex gap-3">
                          {ws.isTeam && (c.authorIsClient || c.pin) && <ResolveButton slug={slug} commentId={c.id} resolved={!!c.resolvedAt} />}
                          {c.authorId === ws.userId && <DeleteCommentButton slug={slug} commentId={c.id} />}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <CommentComposer slug={slug} deliverableId={d.id} versionId={latest?.id ?? null} />
          </section>
        </div>

        <aside className="space-y-6">
          {ws.isTeam && latest && (
            <ChecklistCard
              slug={slug}
              deliverableId={d.id}
              checklist={checklist}
              checklistVersion={checklist ? (d.versions.find((v) => v.id === checklist.versionId)?.version ?? null) : null}
              latestVersion={latest.version}
              openNotes={openNotes}
              allowance={allowance}
              pins={Object.fromEntries(pinNo)}
              billingHref={ws.isOwner ? `/w/${slug}/billing` : null}
            />
          )}
          {clientCanDecide && latest && (
            <Card className="hidden gap-3 lg:flex">
              <CardHeader>
                <CardTitle>Your decision</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Version {latest.version} is waiting for you{due ? `. ${due.label}.` : "."}
                </p>
              </CardHeader>
              <CardContent>
                <ReviewPanel slug={slug} deliverableId={d.id} title={d.title} version={latest.version} agency={ws.name} />
              </CardContent>
            </Card>
          )}

          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <ol className="relative space-y-4 border-l pl-5">
                {buildHistory(d).map((h) => (
                  <li key={h.key} className="relative">
                    <span className={cn("absolute top-0.5 -left-[1.95rem] grid size-5 place-items-center rounded-full ring-4 ring-card", h.tone)}>
                      <h.icon className="size-3" aria-hidden="true" />
                    </span>
                    <p className="text-sm leading-snug">{h.text}</p>
                    {h.note && <p className={cn("mt-1 border-l-2 pl-2 text-sm italic", h.markup ? "border-pen text-foreground/80" : "text-muted-foreground")}>&ldquo;{h.note}&rdquo;</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <time dateTime={h.at} title={new Date(h.at).toUTCString()}>
                        {timeAgo(h.at, now)}
                      </time>
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>

      {clientCanDecide && latest && (
        <ReviewPanel slug={slug} deliverableId={d.id} title={d.title} version={latest.version} agency={ws.name} variant="sticky" />
      )}
    </div>
  );
}

type HistoryEntry = { key: string; at: string; text: string; note?: string; markup?: boolean; icon: typeof ClockIcon; tone: string };

/** Uploads and decisions in one timeline, newest first: the written record clients and agencies both trust. */
function buildHistory(d: Awaited<ReturnType<typeof getDeliverable>>): HistoryEntry[] {
  const entries: HistoryEntry[] = [
    ...d.versions.map((v) => ({
      key: `v-${v.id}`,
      at: v.createdAt,
      text: `${v.uploaderName} uploaded version ${v.version}`,
      icon: FileArrowUpIcon,
      tone: "bg-primary/12 text-primary",
    })),
    ...d.reviews.map((r) => {
      const version = d.versions.find((v) => v.id === r.versionId)?.version;
      return r.decision === "approved"
        ? { key: `r-${r.id}`, at: r.createdAt, text: `${r.reviewerName} approved version ${version}`, note: r.note || undefined, icon: CheckCircleIcon, tone: "bg-status-approved/15 text-status-approved" }
        : { key: `r-${r.id}`, at: r.createdAt, text: `${r.reviewerName} requested changes on version ${version}`, note: r.note || undefined, markup: true, icon: PencilLineIcon, tone: "bg-status-changes/15 text-status-changes" };
    }),
  ];
  if (d.approvalRequestedAt && d.status === "in_review") {
    entries.push({ key: "requested", at: d.approvalRequestedAt, text: "Approval requested", icon: ClockIcon, tone: "bg-status-review/15 text-status-review" });
  }
  return entries.sort((a, b) => b.at.localeCompare(a.at));
}

function DeliverableSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-80" />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Skeleton className="aspect-[4/3]" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
