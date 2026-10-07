import Link from "next/link";
import { CalendarClock, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "cn";
import { StatusBadge } from "@/components/status-badge";
import { ACCENT_SWATCH } from "@/lib/data/clients";
import type { DeliverableRow as Row } from "@/lib/data/deliverables";
import { dueInfo } from "@/lib/format";

const DUE_TONE = { overdue: "text-destructive", soon: "text-status-changes", later: "text-muted-foreground" } as const;

export function DeliverableRow({
  d,
  slug,
  audience,
  showClient = true,
  showNote = false,
  now,
}: {
  d: Row;
  now: number;
  slug: string;
  audience: "team" | "client";
  showClient?: boolean;
  showNote?: boolean;
}) {
  const due = d.status === "in_review" ? dueInfo(d.dueOn, now) : null;
  return (
    <li>
      <Link
        href={`/w/${slug}/d/${d.id}`}
        className="group flex items-center gap-3 px-4 py-3.5 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/60"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate font-medium">{d.title}</p>
            {d.latestVersion > 1 && (
              <span className="rounded border px-1.5 text-[11px] font-medium text-muted-foreground tabular">v{d.latestVersion}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {showClient && (
              <span className="inline-flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", ACCENT_SWATCH[d.client.accent])} aria-hidden="true" />
                {d.client.name}
              </span>
            )}
            {due && (
              <span className={cn("inline-flex items-center gap-1", DUE_TONE[due.tone])}>
                <CalendarClock className="size-3.5" aria-hidden="true" />
                {due.label}
              </span>
            )}
            {d.commentCount > 0 && (
              <span className="inline-flex items-center gap-1 tabular">
                <MessageSquare className="size-3.5" aria-hidden="true" />
                {d.commentCount}
                <span className="sr-only">comments</span>
              </span>
            )}
          </div>
          {showNote && d.lastNote && (
            <p className="line-clamp-2 border-l-2 border-status-changes/50 pl-2 text-sm text-muted-foreground">
              &ldquo;{d.lastNote}&rdquo;
            </p>
          )}
        </div>
        <StatusBadge status={d.status} audience={audience} className="hidden sm:inline-flex" />
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </li>
  );
}
