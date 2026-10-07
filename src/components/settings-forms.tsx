"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
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
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/auth/password-input";
import { initialFormState } from "@/lib/form-state";
import { changePassword, deleteWorkspace, renameWorkspace, updateProfile } from "@/lib/actions/settings";

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
      label="Studio name"
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
        <Button variant="destructive">Delete studio</Button>
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

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, initialFormState);
  const errs = (key: string) => state.fieldErrors?.[key]?.map((message) => ({ message }));
  return (
    // A fresh form after a successful change, so the old values don't linger.
    <form key={state.success ? "done" : "editing"} action={action} noValidate className="space-y-4">
      {state.success && (
        <p role="status" className="flex items-center gap-2 text-sm text-status-approved">
          <CheckCircleIcon weight="fill" className="size-4" aria-hidden="true" />
          {state.success}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!state.fieldErrors?.current}>
          <FieldLabel htmlFor="current-password">Current password</FieldLabel>
          <PasswordInput id="current-password" toggleLabel="Show current password" name="current" autoComplete="current-password" aria-invalid={!!state.fieldErrors?.current} />
          <FieldError errors={errs("current")} />
        </Field>
        <Field data-invalid={!!state.fieldErrors?.next}>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <PasswordInput id="new-password" toggleLabel="Show new password" name="next" autoComplete="new-password" minLength={8} aria-invalid={!!state.fieldErrors?.next} />
          {state.fieldErrors?.next ? <FieldError errors={errs("next")} /> : <FieldDescription>At least 8 characters.</FieldDescription>}
        </Field>
      </div>
      <SubmitButton variant="outline" pendingText="Changing">
        Change password
      </SubmitButton>
    </form>
  );
}
