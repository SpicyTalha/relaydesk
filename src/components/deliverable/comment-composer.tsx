"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowCounterClockwiseIcon, ArrowUpIcon, CheckIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Kbd } from "@/components/ui/kbd";
import { addComment, deleteComment, setCommentResolved } from "@/lib/actions/comments";

export function CommentComposer({ slug, deliverableId, versionId }: { slug: string; deliverableId: string; versionId: string | null }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  function send() {
    if (!body.trim() || pending) return;
    startTransition(async () => {
      const res = await addComment({ slug, deliverableId, versionId, body });
      if (!res.ok) return void toast.error(res.error);
      setBody("");
      ref.current?.focus();
    });
  }

  return (
    <div className="rounded-xl border bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
      <label htmlFor="comment" className="sr-only">
        Add a comment
      </label>
      <Textarea
        ref={ref}
        id="comment"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            send();
          }
        }}
        rows={2}
        maxLength={4000}
        placeholder="Add a comment"
        className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between gap-2 px-3 pb-2">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd> to send
        </span>
        <Button size="sm" onClick={send} disabled={!body.trim() || pending} className="ml-auto">
          {pending ? <Spinner /> : <ArrowUpIcon />}
          Send
        </Button>
      </div>
    </div>
  );
}

export function DeleteCommentButton({ slug, commentId }: { slug: string; commentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteComment({ slug, commentId });
          if (!res.ok) toast.error(res.error);
        })
      }
      className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting" : "Delete"}
    </button>
  );
}

/** The team ticks off feedback once it's handled, or reopens it. */
export function ResolveButton({ slug, commentId, resolved }: { slug: string; commentId: string; resolved: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setCommentResolved({ slug, commentId, resolved: !resolved });
          if (!res.ok) toast.error(res.error);
        })
      }
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
    >
      {resolved ? <ArrowCounterClockwiseIcon className="size-3.5" aria-hidden="true" /> : <CheckIcon className="size-3.5" aria-hidden="true" />}
      {pending ? "Saving" : resolved ? "Reopen" : "Resolve"}
    </button>
  );
}
