"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { SparkleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { generateChecklist, toggleChecklistItem } from "@/lib/actions/checklists";
import type { ChecklistView } from "@/lib/data/checklists";
import { PinMark } from "./pin-layer";

/**
 * The AI revision checklist: the client's open notes on the latest version, as a to-do list
 * for the designer. Every item quotes the note it came from and links back to it.
 */
export function ChecklistCard({
  slug,
  deliverableId,
  checklist,
  checklistVersion,
  latestVersion,
  openNotes,
  allowance,
  pins,
  billingHref,
}: {
  slug: string;
  deliverableId: string;
  checklist: ChecklistView | null;
  checklistVersion: number | null;
  latestVersion: number;
  openNotes: number;
  allowance: { limit: number; left: number };
  /** Pin numbers by comment id, so items can point at the pin they came from. */
  pins: Record<string, number>;
  billingHref: string | null;
}) {
  const [making, startMaking] = useTransition();
  const [, startToggle] = useTransition();
  const [items, setItemDone] = useOptimistic(checklist?.items ?? [], (state, change: { id: string; done: boolean }) =>
    state.map((i) => (i.id === change.id ? { ...i, done: change.done } : i)),
  );

  const make = () =>
    startMaking(async () => {
      const res = await generateChecklist({ slug, deliverableId });
      if (!res.ok) toast.error(res.error);
    });
  const toggle = (id: string, done: boolean) =>
    startToggle(async () => {
      setItemDone({ id, done });
      const res = await toggleChecklistItem({ slug, itemId: id, done });
      if (!res.ok) toast.error(res.error);
    });

  const done = items.filter((i) => i.done).length;
  const stale = checklist && checklistVersion !== null && checklistVersion !== latestVersion;
  const canMake = allowance.limit > 0 && allowance.left > 0 && openNotes > 0;

  return (
    <Card className="gap-0 py-0" data-testid="checklist-card">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center justify-between gap-2">
          Revision checklist
          <span className="inline-flex items-center gap-1 rounded-full bg-process-magenta/10 px-2 py-0.5 text-[11px] font-semibold text-process-magenta">
            <SparkleIcon weight="fill" className="size-3" aria-hidden="true" />
            AI
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        {allowance.limit === 0 ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Turn the client&apos;s notes into a to-do list for the designer, in one click. Comes with Pro and Studio.</p>
            {billingHref && (
              <Button asChild size="sm" variant="outline">
                <Link href={billingHref}>See plans</Link>
              </Button>
            )}
          </div>
        ) : checklist ? (
          <>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {done} of {items.length} done
                </span>
                {checklistVersion !== null && <span className="text-muted-foreground tabular">for v{checklistVersion}</span>}
              </div>
              <Progress value={items.length ? (done / items.length) * 100 : 0} aria-label="Checklist progress" />
            </div>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-2.5">
                  <Checkbox id={`item-${item.id}`} checked={item.done} onCheckedChange={(v) => toggle(item.id, v === true)} className="mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <label htmlFor={`item-${item.id}`} className={cn("block text-sm leading-snug", item.done && "text-muted-foreground line-through")}>
                      {item.body}
                    </label>
                    {item.quote && (
                      <a
                        href={item.commentId ? `#comment-${item.commentId}` : "#comments-title"}
                        className="flex gap-1.5 rounded-sm border-l-2 border-pen pl-2 text-xs text-muted-foreground italic outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {item.commentId && pins[item.commentId] && <PinMark n={pins[item.commentId]} small />}
                        <span className="line-clamp-2">&ldquo;{item.quote}&rdquo;</span>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {stale && <p className="rounded-lg bg-status-changes/10 px-3 py-2 text-xs text-status-changes">Made for v{checklistVersion}. v{latestVersion} is newer.</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {openNotes > 0
              ? `One click turns the ${openNotes} open ${openNotes === 1 ? "note" : "notes"} on v${latestVersion} into a to-do list.`
              : `When the client leaves notes on v${latestVersion}, they can become a to-do list here.`}
          </p>
        )}

        {allowance.limit > 0 && (
          <div className="space-y-2 border-t pt-3">
            {(!checklist || stale || openNotes > 0) && (
              <Button size="sm" className="w-full" variant={checklist ? "outline" : "default"} disabled={!canMake || making} onClick={make}>
                {making ? <Spinner /> : <SparkleIcon weight="fill" />}
                {making ? "Reading the notes" : checklist ? "Make a fresh checklist" : "Make a checklist"}
              </Button>
            )}
            <p className="text-[11px] leading-snug text-muted-foreground">
              Written by AI from the client&apos;s notes; the quotes are theirs, word for word. Check it before you start.{" "}
              <span className="tabular">
                {allowance.left} of {allowance.limit} left this month.
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
