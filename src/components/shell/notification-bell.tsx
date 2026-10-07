"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BellIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getNotifications, markNotificationsSeen, type Notification } from "@/lib/actions/notifications";
import { timeAgo } from "@/lib/format";

const POLL_MS = 30_000;

const TONE: Record<string, string> = {
  "deliverable.approved": "bg-status-approved",
  "changes.requested": "bg-status-changes",
  "approval.requested": "bg-status-review",
  "comment.created": "bg-ink/40",
};

/**
 * What others did in this studio. Checks every 30 seconds while the tab is open (and right away
 * when you come back to it), and marks everything seen when the list is opened.
 */
export function NotificationBell({ slug }: { slug: string }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  // "5 min ago" is measured from when the list last loaded, not on every render.
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const res = await getNotifications(slug);
    setItems(res.items);
    setUnread(res.unread);
    setNow(Date.now());
  }, [slug]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const tick = () => document.visibilityState === "visible" && void load();
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && unread > 0) {
      void markNotificationsSeen(slug);
      setUnread(0);
    }
    // Closing clears the highlight on what's now been seen.
    if (!next) setItems((list) => list.map((i) => ({ ...i, unread: false })));
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
          className="relative grid size-9 place-items-center rounded-full border bg-card text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <BellIcon className="size-[18px]" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-process-yellow px-1 text-[10px] font-bold text-ink ring-2 ring-background tabular">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0">
        <p className="border-b px-4 py-3 text-sm font-semibold">Notifications</p>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing yet. When someone else acts, it shows up here.</p>
        ) : (
          <ul className="max-h-[22rem] overflow-y-auto py-1">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={cn("flex gap-3 px-4 py-2.5 text-sm outline-none hover:bg-muted focus-visible:bg-muted", n.unread && "bg-process-yellow/15")}
                >
                  <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", TONE[n.action] ?? "bg-ink/25")} />
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug">{n.text}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {n.context && `${n.context} · `}
                      {timeAgo(n.at, now)}
                      {n.unread && <span className="sr-only"> (new)</span>}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
