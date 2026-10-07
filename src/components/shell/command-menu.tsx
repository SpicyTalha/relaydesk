"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcon, FileIcon, FolderIcon, GearIcon, MagnifyingGlassIcon, TrayIcon, UsersIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { getSearchIndex, type SearchIndex } from "@/lib/actions/search";
import { STATUS_DOT, STATUS_LABEL } from "@/lib/status";

/**
 * ⌘K (Ctrl+K): jump to any client, deliverable or page. The index loads the first time it opens
 * and refreshes on each open after that, so it never shows a deleted deliverable for long.
 */
export function CommandMenu({ slug, audience, isOwner }: { slug: string; audience: "team" | "client"; isOwner: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loading, startLoading] = useTransition();
  // ⌘ on Apple keyboards, Ctrl everywhere else, read once on the client so server and browser agree.
  const [shortcut] = useState(() => (typeof navigator !== "undefined" && !/Mac|iPhone|iPad/.test(navigator.userAgent) ? "Ctrl K" : "⌘K"));

  const show = useCallback(() => {
    setOpen(true);
    startLoading(async () => setIndex(await getSearchIndex(slug)));
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, show]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const base = `/w/${slug}`;
  const pages =
    audience === "team"
      ? [
          { label: "Overview", href: base, icon: TrayIcon },
          { label: "Team", href: `${base}/team`, icon: UsersIcon },
          { label: "Settings", href: `${base}/settings`, icon: GearIcon },
          ...(isOwner ? [{ label: "Billing", href: `${base}/billing`, icon: CreditCardIcon }] : []),
        ]
      : [
          { label: "All work", href: base, icon: TrayIcon },
          { label: "Settings", href: `${base}/settings`, icon: GearIcon },
        ];

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="inline-flex h-9 items-center gap-2 rounded-full border bg-card pr-1.5 pl-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
        <span className="sr-only sm:hidden">Search</span>
        <Kbd className="hidden sm:inline-flex" suppressHydrationWarning>
          {shortcut}
        </Kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to a client, a deliverable or a page." className="sm:max-w-xl">
        <Command>
          <CommandInput placeholder={audience === "team" ? "Search clients and work..." : "Search your work..."} />
          <CommandList>
            <CommandEmpty>{loading && !index ? <Spinner className="mx-auto" /> : "Nothing matches that."}</CommandEmpty>
            {index && index.deliverables.length > 0 && (
              <CommandGroup heading="Work">
                {index.deliverables.map((d) => (
                  <CommandItem key={d.id} value={`${d.title} ${d.client}`} onSelect={() => go(`${base}/d/${d.id}`)}>
                    <FileIcon aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">
                      {d.title}
                      {audience === "team" && <span className="text-muted-foreground"> · {d.client}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("size-1.5 rounded-full", STATUS_DOT[d.status])} aria-hidden="true" />
                      {STATUS_LABEL[audience][d.status]}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {index && index.clients.length > 0 && (
              <CommandGroup heading="Clients">
                {index.clients.map((c) => (
                  <CommandItem key={c.id} value={`client ${c.name}`} onSelect={() => go(`${base}/c/${c.id}`)}>
                    <FolderIcon aria-hidden="true" />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading="Pages">
              {pages.map((p) => (
                <CommandItem key={p.href} value={`page ${p.label}`} onSelect={() => go(p.href)}>
                  <p.icon aria-hidden="true" />
                  {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
