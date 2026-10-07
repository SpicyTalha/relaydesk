"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { cn } from "cn";
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
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import { createClientSpace, type CreateClientState } from "@/lib/actions/clients";

const ACCENTS = [
  ["blue", "bg-blue-500"],
  ["emerald", "bg-emerald-500"],
  ["amber", "bg-amber-500"],
  ["rose", "bg-rose-500"],
  ["violet", "bg-violet-500"],
  ["cyan", "bg-cyan-500"],
  ["orange", "bg-orange-500"],
  ["slate", "bg-slate-500"],
] as const;

export function AddClientDialog({ slug, trigger }: { slug: string; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // On success the action redirects to the new client, so only errors come back here.
  const [state, action] = useActionState<CreateClientState, FormData>(createClientSpace, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus />
            Add client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={action} noValidate className="space-y-5">
          <input type="hidden" name="slug" value={slug} />
          <DialogHeader>
            <DialogTitle>Add a client</DialogTitle>
            <DialogDescription>Each client gets a private space. They only ever see their own work.</DialogDescription>
          </DialogHeader>
          {state.error && (
            <Alert variant={state.upgrade ? "default" : "destructive"}>
              {state.upgrade && <Sparkles />}
              <AlertDescription>
                {state.error}{" "}
                {state.upgrade && (
                  <Link href={`/w/${slug}/billing`} className="font-medium text-primary underline-offset-4 hover:underline">
                    See plans
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}
          <Field data-invalid={!!state.fieldErrors?.name}>
            <FieldLabel htmlFor="client-name">Client name</FieldLabel>
            <Input
              id="client-name"
              name="name"
              placeholder="Northwind Coffee"
              autoComplete="off"
              required
              defaultValue={state.values?.name}
              aria-invalid={!!state.fieldErrors?.name}
            />
            <FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} />
          </Field>
          <FieldSet>
            <FieldLegend variant="label">Color</FieldLegend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Client color">
              {ACCENTS.map(([value, swatch], i) => (
                <label key={value} className="relative cursor-pointer">
                  <input type="radio" name="accent" value={value} defaultChecked={i === 0} className="peer sr-only" />
                  <span
                    className={cn(
                      "block size-7 rounded-full ring-offset-2 ring-offset-background transition peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                      swatch,
                    )}
                  />
                  <span className="sr-only">{value}</span>
                </label>
              ))}
            </div>
          </FieldSet>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingText="Adding">Add client</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
