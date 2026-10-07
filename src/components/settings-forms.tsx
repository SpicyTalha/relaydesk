"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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
import { deleteWorkspace, renameWorkspace, updateProfile } from "@/lib/actions/settings";

export function SingleFieldForm({
  id,
  label,
  description,
  initial,
  maxLength,
  disabled,
  save,
}: {
  id: string;
  label: string;
  description?: string;
  initial: string;
  maxLength: number;
  disabled?: boolean;
  save: (value: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = value.trim() !== saved;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await save(value);
          if (!res.ok) return setError(res.error ?? "Couldn't save.");
          setError(null);
          setSaved(value.trim());
          toast.success("Saved.");
        });
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <Field data-invalid={!!error} className="flex-1">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Input id={id} value={value} onChange={(e) => setValue(e.target.value)} maxLength={maxLength} disabled={disabled} aria-invalid={!!error} />
        {error ? <FieldError>{error}</FieldError> : description && <FieldDescription>{description}</FieldDescription>}
      </Field>
      <Button type="submit" variant="outline" disabled={!dirty || pending || disabled} className="sm:mb-[1.625rem]">
        {pending && <Spinner />}
        Save
      </Button>
    </form>
  );
}

export function WorkspaceNameForm({ slug, name, disabled }: { slug: string; name: string; disabled: boolean }) {
  return (
    <SingleFieldForm
      id="ws-name"
      label="Workspace name"
      description={disabled ? "Only owners can change this." : "Clients see this on every page."}
      initial={name}
      maxLength={60}
      disabled={disabled}
      save={(value) => renameWorkspace({ slug, name: value })}
    />
  );
}

export function ProfileForm({ fullName }: { fullName: string }) {
  return (
    <SingleFieldForm
      id="full-name"
      label="Your name"
      description="Shown next to your comments and approvals."
      initial={fullName}
      maxLength={80}
      save={(value) => updateProfile({ fullName: value })}
    />
  );
}

export function DeleteWorkspace({ slug, name }: { slug: string; name: string }) {
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog onOpenChange={(o) => !o && setConfirm("")}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete workspace</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Every client space, file, comment and approval is deleted for everyone, including your clients. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="confirm-name">
            Type <span className="font-semibold">{name}</span> to confirm
          </FieldLabel>
          <Input id="confirm-name" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={confirm.trim() !== name || pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteWorkspace({ slug, confirmName: confirm });
                if (res && !res.ok) toast.error(res.error);
              })
            }
          >
            {pending && <Spinner />}
            Delete forever
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
