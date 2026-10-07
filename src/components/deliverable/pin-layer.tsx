"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { addComment } from "@/lib/actions/comments";

export type PinView = { id: string; n: number; x: number; y: number; body: string; author: string; resolved: boolean };

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Red-pen pins over a version's image. Tapping the work drops a numbered pin and opens a note
 * right there (a bottom sheet on phones). Each pin links to its comment in the thread.
 */
export function PinLayer({
  slug,
  deliverableId,
  versionId,
  pins,
  canPin,
}: {
  slug: string;
  deliverableId: string;
  versionId: string;
  pins: PinView[];
  canPin: boolean;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!draft) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !pending && setDraft(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, pending]);

  function place(e: React.MouseEvent<HTMLDivElement>) {
    if (!canPin || pending || (e.target as HTMLElement).closest("[data-pin], [data-pin-form]")) return;
    const r = layer.current!.getBoundingClientRect();
    setDraft({ x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) });
    setBody("");
  }

  function save() {
    if (!draft || !body.trim() || pending) return;
    startTransition(async () => {
      const res = await addComment({ slug, deliverableId, versionId, body, pin: draft });
      if (!res.ok) return void toast.error(res.error);
      setDraft(null);
      setBody("");
    });
  }

  const next = pins.length + 1;
  const at = (p: { x: number; y: number }) => ({ left: `${p.x * 100}%`, top: `${p.y * 100}%` });

  return (
    <div ref={layer} onClick={place} data-testid="pin-layer" className={cn("absolute inset-0", canPin && "cursor-crosshair")}>
      {pins.map((p) => (
        <a
          key={p.id}
          data-pin
          href={`#comment-${p.id}`}
          style={at(p)}
          aria-label={`Pin ${p.n}${p.resolved ? ", resolved" : ""}: ${p.body}`}
          className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
        >
          <PinMark n={p.n} resolved={p.resolved} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 w-max max-w-56 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-left text-xs leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <span className="font-semibold">{p.author}:</span> {p.body}
          </span>
        </a>
      ))}

      {draft && (
        <>
          <span data-pin style={at(draft)} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-in motion-safe:zoom-in-50">
            <PinMark n={next} />
          </span>
          <form
            data-pin-form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            style={at(draft)}
            className={cn(
              "absolute z-30 w-64 space-y-2 rounded-xl bg-white p-3 text-ink shadow-[0_24px_50px_-20px_rgb(0_0_0/0.55)] ring-1 ring-ink/10",
              draft.x > 0.55 ? "-translate-x-[calc(100%+1.5rem)]" : "translate-x-6",
              draft.y > 0.6 ? "-translate-y-full" : "-translate-y-4",
              // On phones the note is a sheet at the bottom of the screen, never cut off by the edges.
              "max-sm:fixed max-sm:inset-x-3 max-sm:top-auto! max-sm:bottom-3 max-sm:left-3! max-sm:z-50 max-sm:w-auto max-sm:translate-x-0 max-sm:translate-y-0",
            )}
          >
            <label htmlFor="pin-note" className="flex items-center gap-2 text-sm font-semibold">
              <PinMark n={next} small />
              Note on this spot
            </label>
            <Textarea
              id="pin-note"
              autoFocus
              rows={3}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  save();
                }
              }}
              placeholder="What should change here?"
              className="resize-none bg-white"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!body.trim() || pending}>
                {pending && <Spinner />}
                Pin note
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

/** A red-pen circle with a handwritten number; green and quiet once the studio resolves it. */
export function PinMark({ n, resolved = false, small = false }: { n: number; resolved?: boolean; small?: boolean }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-[2.5px] bg-white font-pen leading-none shadow-[0_4px_10px_-3px_rgb(0_0_0/0.45)] tabular",
        small ? "size-6 text-sm" : "size-8 text-lg",
        resolved ? "border-status-approved text-status-approved opacity-80" : "border-pen text-pen",
      )}
    >
      {n}
    </span>
  );
}
