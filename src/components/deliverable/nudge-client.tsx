"use client";

import { useState, useTransition } from "react";
import { BellRingingIcon, CopyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { addComment } from "@/lib/actions/comments";

/**
 * A polite reminder for work that's waiting on the client: copy it into email or chat, or post it
 * on the deliverable, where the client sees it in their notifications.
 */
export function NudgeClient({
  slug,
  deliverableId,
  title,
  version,
  versionId,
  dueLabel,
  names,
  overdue,
}: {
  slug: string;
  deliverableId: string;
  title: string;
  version: number;
  versionId: string;
  dueLabel: string | null;
  names: string[];
  overdue: boolean;
}) {
  const greeting = names.length ? `Hi ${names.join(" and ")},` : "Hi,";
  const draft = (link: string) =>
    `${greeting} a quick nudge: ${title} (version ${version}) is waiting for your review${dueLabel ? ` and is ${dueLabel.toLowerCase()}` : ""}. ` +
    `It takes a minute: approve it, or tap the spots you'd like changed.\n\n${link}`;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [posting, startPosting] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) setText(draft(`${window.location.origin}/w/${slug}/d/${deliverableId}`));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied. Paste it into an email or chat.");
    } catch {
      toast.error("Your browser blocked copying. Select the text and copy it instead.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant={overdue ? "default" : "outline"} className={overdue ? "bg-pen text-white hover:bg-pen/90" : ""}>
          <BellRingingIcon />
          Nudge client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nudge {names[0] ?? "the client"}</DialogTitle>
          <DialogDescription>A friendly reminder, ready to send. Edit it however you like.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="nudge-text" className="sr-only">
            Reminder
          </FieldLabel>
          <Textarea id="nudge-text" rows={6} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} />
          <FieldDescription>Posting it adds it to the comments, and the client sees it in their notifications.</FieldDescription>
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={copy} disabled={!text.trim()}>
            <CopyIcon />
            Copy message
          </Button>
          <Button
            disabled={!text.trim() || posting}
            onClick={() =>
              startPosting(async () => {
                const res = await addComment({ slug, deliverableId, versionId, body: text });
                if (!res.ok) return void toast.error(res.error);
                toast.success("Posted. They'll see it next time they look.");
                setOpen(false);
              })
            }
          >
            {posting && <Spinner />}
            Post as a comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
