"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Send, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Dropzone } from "@/components/uploads/dropzone";
import { deleteDeliverable, requestApproval, updateDeliverable } from "@/lib/actions/deliverables";
import { uploadVersion, type UploadStep } from "@/lib/upload-client";
import type { DeliverableStatus } from "@/lib/status";

const STEP_TEXT: Record<UploadStep, string> = { preparing: "Preparing", uploading: "Uploading", saving: "Finishing" };

export function TeamActions(props: {
  slug: string;
  deliverableId: string;
  title: string;
  description: string;
  dueOn: string | null;
  status: DeliverableStatus;
  hasVersions: boolean;
  nextVersion: number;
  clientName: string;
  isDemo: boolean;
}) {
  const { slug, deliverableId, status, hasVersions, clientName } = props;
  const router = useRouter();
  const [dialog, setDialog] = useState<"ask" | "upload" | "edit" | "delete" | null>(null);
  const [pending, startTransition] = useTransition();
  const canAsk = hasVersions && (status === "draft" || status === "changes_requested");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [askAgain, setAskAgain] = useState(true);
  const [step, setStep] = useState<UploadStep | null>(null);

  function close() {
    if (pending) return;
    setDialog(null);
    setFile(null);
    setNote("");
    setStep(null);
  }

  function ask(formData: FormData) {
    startTransition(async () => {
      const res = await requestApproval({ slug, deliverableId, dueOn: String(formData.get("dueOn") ?? "") || null });
      if (!res.ok) return void toast.error(res.error);
      toast.success(`Sent to ${clientName} for approval.`);
      setDialog(null);
    });
  }

  function upload() {
    if (!file) return;
    startTransition(async () => {
      const res = await uploadVersion({
        slug,
        deliverableId,
        file,
        note,
        requestApproval: askAgain,
        dueOn: props.dueOn,
        redirectTo: `/w/${slug}/d/${deliverableId}`,
        onStep: setStep,
      });
      setStep(null);
      if (!res.ok) return void toast.error(res.error);
      // Success navigates (server-side redirect), which also closes this dialog.
    });
  }

  function save(formData: FormData) {
    startTransition(async () => {
      const res = await updateDeliverable({
        slug,
        deliverableId,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        dueOn: String(formData.get("dueOn") ?? "") || null,
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Saved.");
      setDialog(null);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteDeliverable({ slug, deliverableId });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Deliverable deleted.");
      router.push(`/w/${slug}/c/${res.clientId}`);
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canAsk && (
          <Button onClick={() => setDialog("ask")}>
            <Send />
            Ask for approval
          </Button>
        )}
        <Button variant={canAsk ? "outline" : "default"} onClick={() => setDialog("upload")}>
          <Upload />
          {hasVersions ? `Upload v${props.nextVersion}` : "Upload file"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDialog("edit")}>
              <Pencil />
              Edit details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={dialog === "ask"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-sm">
          <form action={ask} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Ask {clientName} to approve</DialogTitle>
              <DialogDescription>They&apos;ll see the latest version and can approve or ask for changes.</DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="ask-due">Due date</FieldLabel>
              <Input id="ask-due" name="dueOn" type="date" defaultValue={props.dueOn ?? ""} />
              <FieldDescription>Optional. Overdue requests are flagged on your overview.</FieldDescription>
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Spinner />}
                Send request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "upload"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{hasVersions ? `Upload version ${props.nextVersion}` : "Upload the first version"}</DialogTitle>
            <DialogDescription>Earlier versions stay available, so nothing gets lost.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Dropzone file={file} onFile={setFile} isDemo={props.isDemo} disabled={pending} />
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="up-note">What changed?</FieldLabel>
                <Textarea
                  id="up-note"
                  rows={2}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Bigger prices, darker background on the specials."
                  disabled={pending}
                />
              </Field>
              <Field orientation="horizontal" className="rounded-lg border p-3">
                <FieldContent>
                  <FieldLabel htmlFor="up-ask">Ask {clientName} to approve it</FieldLabel>
                  <FieldDescription>Sends the new version for review right away.</FieldDescription>
                </FieldContent>
                <Switch id="up-ask" checked={askAgain} onCheckedChange={setAskAgain} disabled={pending} />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={upload} disabled={pending || !file}>
              {step ? (
                <>
                  <Spinner />
                  {STEP_TEXT[step]}
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "edit"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <form action={save} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Edit details</DialogTitle>
            </DialogHeader>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="ed-title">Title</FieldLabel>
                <Input id="ed-title" name="title" defaultValue={props.title} maxLength={120} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="ed-due">Due date</FieldLabel>
                <Input id="ed-due" name="dueOn" type="date" defaultValue={props.dueOn ?? ""} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ed-desc">Note for the client</FieldLabel>
                <Textarea id="ed-desc" name="description" rows={3} maxLength={2000} defaultValue={props.description} />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Spinner />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialog === "delete"} onOpenChange={(o) => !o && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {props.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              All versions, comments and the approval history are deleted for you and {clientName}. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={pending} className="bg-destructive text-white hover:bg-destructive/90">
              {pending && <Spinner />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
