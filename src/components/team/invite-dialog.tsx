"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Copy, Link2, Sparkles, UserPlus } from "lucide-react";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { createInvitation } from "@/lib/actions/team";

type ClientOption = { id: string; name: string };

export function InviteDialog({
  slug,
  clients,
  canInviteTeam,
  defaultOpen = false,
  defaultRole = "client",
  defaultClientId,
}: {
  slug: string;
  clients: ClientOption[];
  canInviteTeam: boolean;
  defaultOpen?: boolean;
  defaultRole?: "member" | "client";
  defaultClientId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [role, setRole] = useState<"member" | "client">(canInviteTeam ? defaultRole : "client");
  const [clientId, setClientId] = useState(defaultClientId ?? clients[0]?.id ?? "");
  const [error, setError] = useState<{ message: string; upgrade?: boolean } | null>(null);
  const [result, setResult] = useState<{ link: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function reset() {
    setError(null);
    setResult(null);
    setCopied(false);
  }

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createInvitation({
        slug,
        email: String(formData.get("email") ?? ""),
        role,
        clientId: role === "client" ? clientId : null,
      });
      if (!res.ok) return setError({ message: res.error, upgrade: res.upgrade });
      setResult({ link: res.link, email: res.email });
    });
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const clientName = clients.find((c) => c.id === clientId)?.name;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (pending) return;
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {result ? (
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle>Invitation ready</DialogTitle>
              <DialogDescription>
                Send this link to {result.email}. It works once, only for that email address, and expires in 7 days.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2 pl-3">
              <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <code className="min-w-0 flex-1 truncate font-mono text-xs">{result.link}</code>
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              For security we only store a fingerprint of this link, so it can&apos;t be shown again. If it gets lost, revoke it and invite again.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={reset}>
                Invite someone else
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={submit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Invite someone</DialogTitle>
              <DialogDescription>
                {role === "client"
                  ? `Clients only see their own space${clientName ? `, here ${clientName}` : ""}.`
                  : "Teammates can see every client and manage deliverables."}
              </DialogDescription>
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
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="inv-email">Email</FieldLabel>
                <Input id="inv-email" name="email" type="email" autoComplete="off" required placeholder="daniel@northwind.coffee" />
              </Field>
              {canInviteTeam && (
                <Field>
                  <FieldLabel htmlFor="inv-role">Access</FieldLabel>
                  <Select value={role} onValueChange={(v) => setRole(v as "member" | "client")}>
                    <SelectTrigger id="inv-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client: sees one client space</SelectItem>
                      <SelectItem value="member">Teammate: sees every client</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              {role === "client" && (
                <Field>
                  <FieldLabel htmlFor="inv-client">Client</FieldLabel>
                  {clients.length ? (
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger id="inv-client" className="w-full">
                        <SelectValue placeholder="Choose a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FieldDescription>Add a client first, then invite people from it.</FieldDescription>
                  )}
                </Field>
              )}
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || (role === "client" && !clientId)}>
                {pending && <Spinner />}
                Create invite link
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
