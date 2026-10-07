"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Dropzone } from "./dropzone";
import { createDeliverable } from "@/lib/actions/deliverables";
import { uploadVersion, type UploadStep } from "@/lib/upload-client";

const STEP_TEXT: Record<UploadStep | "creating", string> = {
  creating: "Creating",
  preparing: "Preparing upload",
  uploading: "Uploading",
  saving: "Finishing",
};

/** "spring-menu_board-v1.pdf" -> "Spring menu board" */
function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\bv\d+\b/i, "").replace(/\s+/g, " ").trim();
  return base ? base[0].toUpperCase() + base.slice(1) : "";
}

export function NewDeliverableDialog({
  slug,
  clientId,
  clientName,
  isDemo,
}: {
  slug: string;
  clientId: string;
  clientName: string;
  isDemo: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [askNow, setAskNow] = useState(true);
  const [step, setStep] = useState<UploadStep | "creating" | null>(null);
  const [error, setError] = useState<{ message: string; upgrade?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const busy = isPending || step !== null;

  function reset() {
    setFile(null);
    setTitle("");
    setTitleTouched(false);
    setAskNow(true);
    setStep(null);
    setError(null);
  }

  function onFile(f: File | null) {
    setFile(f);
    if (f && !titleTouched) setTitle(titleFromFileName(f.name));
  }

  function submit(formData: FormData) {
    if (!file) {
      setError({ message: "Add a file first." });
      return;
    }
    const dueOn = String(formData.get("dueOn") ?? "") || null;
    setError(null);
    startTransition(async () => {
      setStep("creating");
      const created = await createDeliverable({
        slug,
        clientId,
        title,
        description: String(formData.get("description") ?? ""),
        dueOn,
      });
      if (!created.ok) {
        setStep(null);
        setError({ message: created.error, upgrade: created.upgrade });
        return;
      }
      const uploaded = await uploadVersion({
        slug,
        deliverableId: created.deliverableId,
        file,
        requestApproval: askNow,
        dueOn,
        redirectTo: `/w/${slug}/d/${created.deliverableId}`,
        onStep: setStep,
      });
      if (!uploaded.ok) {
        // The draft exists without a file; send them to it so they can retry the upload there.
        setStep(null);
        toast.error(uploaded.error);
        router.push(`/w/${slug}/d/${created.deliverableId}`);
        setOpen(false);
        return;
      }
      // On success the server action has already navigated to the new deliverable.
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return; // Don't lose an upload in progress.
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New deliverable
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form action={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>New deliverable for {clientName}</DialogTitle>
            <DialogDescription>Upload the first version. Later uploads become v2, v3 and so on.</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant={error.upgrade ? "default" : "destructive"}>
              {error.upgrade && <Sparkles />}
              <AlertDescription>
                {error.message}{" "}
                {error.upgrade && (
                  <Link href={`/w/${slug}/billing`} className="font-medium text-primary underline-offset-4 hover:underline">
                    See plans
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Dropzone file={file} onFile={onFile} isDemo={isDemo} disabled={busy} />

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="nd-title">Title</FieldLabel>
              <Input
                id="nd-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleTouched(true);
                }}
                placeholder="Spring menu board"
                maxLength={120}
                required
                disabled={busy}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <Field>
                <FieldLabel htmlFor="nd-due">Due date</FieldLabel>
                <Input id="nd-due" name="dueOn" type="date" disabled={busy} />
              </Field>
              <Field>
                <FieldLabel htmlFor="nd-desc">Note for the client</FieldLabel>
                <Textarea
                  id="nd-desc"
                  name="description"
                  rows={1}
                  maxLength={2000}
                  placeholder="Optional"
                  className="min-h-9"
                  disabled={busy}
                />
              </Field>
            </div>
            <Field orientation="horizontal" className="rounded-lg border p-3">
              <FieldContent>
                <FieldLabel htmlFor="nd-ask">Ask {clientName} to approve now</FieldLabel>
                <FieldDescription>Turn off to keep it as a draft only your team can see.</FieldDescription>
              </FieldContent>
              <Switch id="nd-ask" checked={askNow} onCheckedChange={setAskNow} disabled={busy} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !file || !title.trim()}>
              {step ? (
                <>
                  <Spinner />
                  {STEP_TEXT[step]}
                </>
              ) : askNow ? (
                "Upload and send"
              ) : (
                "Save draft"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
