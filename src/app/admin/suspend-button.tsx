"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { setStudioSuspended } from "@/lib/actions/admin";

export function SuspendButton({ workspaceId, name, suspended }: { workspaceId: string; name: string; suspended: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && (setOpen(o), setReason(""))}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={suspended ? "outline" : "ghost"} className={suspended ? "" : "text-destructive hover:text-destructive"}>
          {suspended ? "Lift suspension" : "Suspend"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{suspended ? `Lift the suspension on ${name}?` : `Suspend ${name}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {suspended
              ? "The studio and its clients can make changes again."
              : "Everyone keeps read access to their work, but nobody in this studio can upload, comment, approve or invite until it's lifted."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="reason">Reason, for the audit log</FieldLabel>
          <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant={suspended ? "default" : "destructive"}
            disabled={reason.trim().length < 3 || pending}
            onClick={() =>
              startTransition(async () => {
                const res = await setStudioSuspended({ workspaceId, suspended: !suspended, reason });
                if (!res.ok) return void toast.error(res.error);
                toast.success(suspended ? `${name} can make changes again.` : `${name} is suspended.`);
                setOpen(false);
              })
            }
          >
            {pending && <Spinner />}
            {suspended ? "Lift suspension" : "Suspend studio"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
