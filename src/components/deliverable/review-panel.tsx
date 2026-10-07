"use client";

import { useState, useTransition } from "react";
import { CheckIcon, PencilLineIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { submitReview } from "@/lib/actions/deliverables";

/** The client's decision. Shown inline on desktop and as a sticky bar on phones. */
export function ReviewPanel({
  slug,
  deliverableId,
  title,
  version,
  agency,
  variant = "inline",
}: {
  slug: string;
  deliverableId: string;
  title: string;
  version: number;
  agency: string;
  variant?: "inline" | "sticky";
}) {
  const [pending, startTransition] = useTransition();
  const [changesOpen, setChangesOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  function decide(decision: "approved" | "changes_requested") {
    if (decision === "changes_requested" && !note.trim()) {
      setNoteError("Tell the team what to change.");
      return;
    }
    startTransition(async () => {
      const res = await submitReview({ slug, deliverableId, decision, note });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setChangesOpen(false);
      setNote("");
      toast.success(decision === "approved" ? `Approved. ${agency} can see your decision now.` : `Sent your notes to ${agency}.`);
    });
  }

  const buttons = (
    <div className="grid grid-cols-2 gap-2">
      <Dialog open={changesOpen} onOpenChange={(o) => !pending && setChangesOpen(o)}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg" disabled={pending}>
            <PencilLineIcon />
            Request changes
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What should change?</DialogTitle>
            <DialogDescription>
              Your notes go to {agency} with version {version} of {title}.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!noteError}>
            <FieldLabel htmlFor="change-note" className="sr-only">
              Your notes
            </FieldLabel>
            <Textarea
              id="change-note"
              rows={5}
              maxLength={2000}
              autoFocus
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteError(null);
              }}
              placeholder="The prices are hard to read from the counter. Can they be bigger?"
              aria-invalid={!!noteError}
            />
            {noteError ? <FieldError>{noteError}</FieldError> : <FieldDescription>Be specific. It saves a round of back and forth.</FieldDescription>}
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setChangesOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={() => decide("changes_requested")} disabled={pending}>
              {pending && <Spinner />}
              Send to {agency}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="lg" disabled={pending} className="bg-status-approved text-white hover:bg-status-approved/90">
            <CheckIcon />
            Approve
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve version {version}?</AlertDialogTitle>
            <AlertDialogDescription>
              {title} will be marked as approved, with your name and today&apos;s date. {agency} will see it right away.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Not yet</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => decide("approved")}
              disabled={pending}
              className="bg-status-approved text-white hover:bg-status-approved/90"
            >
              {pending && <Spinner />}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (variant === "sticky") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {buttons}
      </div>
    );
  }
  return buttons;
}
