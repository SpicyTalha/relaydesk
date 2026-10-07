"use client";

import { useState, useTransition } from "react";
import { DotsThreeIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { changeRole, removeMember, revokeInvitation } from "@/lib/actions/team";
import type { Role } from "@/lib/data/workspace";

export function MemberActions({ slug, membershipId, name, role }: { slug: string; membershipId: string; name: string; role: Role }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "Something went wrong.");
      else toast.success(success);
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`} disabled={pending}>
            <DotsThreeIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {role === "member" && (
            <DropdownMenuItem onSelect={() => run(() => changeRole({ slug, membershipId, role: "owner" }), `${name} is now an owner.`)}>
              Make owner
            </DropdownMenuItem>
          )}
          {role === "owner" && (
            <DropdownMenuItem onSelect={() => run(() => changeRole({ slug, membershipId, role: "member" }), `${name} is now a teammate.`)}>
              Make teammate
            </DropdownMenuItem>
          )}
          {role !== "client" && <DropdownMenuSeparator />}
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
            Remove from workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access right away. Their comments and approvals stay in the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => run(() => removeMember({ slug, membershipId }), `${name} was removed.`)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function RevokeInviteButton({ slug, invitationId, email }: { slug: string; invitationId: string; email: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await revokeInvitation({ slug, invitationId });
          if (!res.ok) toast.error(res.error);
          else toast.success(`Invite for ${email} revoked.`);
        })
      }
    >
      Revoke
    </Button>
  );
}
