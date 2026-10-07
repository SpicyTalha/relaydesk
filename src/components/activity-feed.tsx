import Link from "next/link";
import { ChatCircleIcon, CheckCircleIcon, FileArrowUpIcon, FilePlusIcon, FolderPlusIcon, PaperPlaneTiltIcon, PencilLineIcon, SparkleIcon, UserPlusIcon } from "@phosphor-icons/react/ssr";
import { cn } from "cn";
import type { ActivityItem } from "@/lib/data/activity";
import { firstName, timeAgo } from "@/lib/format";

const ICON: Record<string, { icon: typeof PaperPlaneTiltIcon; tone: string }> = {
  "approval.requested": { icon: PaperPlaneTiltIcon, tone: "text-status-review bg-status-review/12" },
  "deliverable.approved": { icon: CheckCircleIcon, tone: "text-status-approved bg-status-approved/12" },
  "changes.requested": { icon: PencilLineIcon, tone: "text-status-changes bg-status-changes/14" },
  "version.uploaded": { icon: FileArrowUpIcon, tone: "text-primary bg-primary/10" },
  "comment.created": { icon: ChatCircleIcon, tone: "text-muted-foreground bg-muted" },
  "member.joined": { icon: UserPlusIcon, tone: "text-muted-foreground bg-muted" },
  "client.created": { icon: FolderPlusIcon, tone: "text-muted-foreground bg-muted" },
  "deliverable.created": { icon: FilePlusIcon, tone: "text-muted-foreground bg-muted" },
  "workspace.created": { icon: SparkleIcon, tone: "text-primary bg-primary/10" },
};

function describe(a: ActivityItem): React.ReactNode {
  const who = <span className="font-medium text-foreground">{firstName(a.actorName)}</span>;
  const what = a.deliverableTitle ? <span className="font-medium text-foreground">{a.deliverableTitle}</span> : "a deliverable";
  switch (a.action) {
    case "approval.requested":
      return <>{who} asked for approval on {what}</>;
    case "deliverable.approved":
      return <>{who} approved {what}</>;
    case "changes.requested":
      return <>{who} requested changes on {what}</>;
    case "version.uploaded":
      return <>{who} uploaded version {String(a.metadata.version ?? "")} of {what}</>;
    case "comment.created":
      return <>{who} commented on {what}</>;
    case "member.joined":
      return a.metadata.role === "client" ? <>{who} joined {a.clientName ?? "a client space"}</> : <>{who} joined the team</>;
    case "client.created":
      return <>{who} added the client <span className="font-medium text-foreground">{String(a.metadata.name ?? a.clientName ?? "")}</span></>;
    case "deliverable.created":
      return <>{who} created {what}</>;
    case "workspace.created":
      return <>{who} created the workspace</>;
    default:
      return <>{who} made a change</>;
  }
}

export function ActivityFeed({
  items,
  slug,
  now,
  showClient = true,
  emptyText = "Nothing here yet.",
}: {
  items: ActivityItem[];
  now: number;
  slug: string;
  showClient?: boolean;
  emptyText?: string;
}) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ol className="space-y-0.5">
      {items.map((a) => {
        const { icon: Icon, tone } = ICON[a.action] ?? ICON["comment.created"];
        const body = (
          <>
            <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", tone)}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-sm text-muted-foreground">
              <span className="block leading-snug">{describe(a)}</span>
              {typeof a.metadata.note === "string" && a.metadata.note && (
                <span className={cn("mt-1 line-clamp-2 block border-l-2 pl-2 text-[13px] italic", a.action === "changes.requested" && "border-pen text-foreground/80")}>&ldquo;{a.metadata.note}&rdquo;</span>
              )}
              <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs">
                {showClient && a.clientName && <span>{a.clientName}</span>}
                <time dateTime={a.createdAt}>{timeAgo(a.createdAt, now)}</time>
              </span>
            </span>
          </>
        );
        return (
          <li key={a.id}>
            {a.deliverableId ? (
              <Link
                href={`/w/${slug}/d/${a.deliverableId}`}
                className="flex gap-3 rounded-lg px-2 py-2 outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
              >
                {body}
              </Link>
            ) : (
              <div className="flex gap-3 px-2 py-2">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
