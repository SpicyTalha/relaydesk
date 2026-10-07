import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Clock, LinkIcon, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "../../actions";
import { AcceptInviteForm } from "./accept-form";

export const metadata: Metadata = { title: "You're invited" };

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Invite params={params} />
    </Suspense>
  );
}

async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const [{ data }, user] = await Promise.all([supabase.rpc("get_invitation", { p_token: token }), getCurrentUser()]);
  const invite = data?.[0];
  const here = `/invite/${token}`;

  if (!invite) {
    return (
      <Message icon={LinkIcon} title="This invitation isn't valid">
        It may have been used already or revoked. Ask the person who invited you for a new link.
        <Button variant="outline" className="mt-6 w-full" asChild>
          <Link href="/login">Go to sign in</Link>
        </Button>
      </Message>
    );
  }

  if (invite.expired) {
    return (
      <Message icon={Clock} title="This invitation has expired">
        Invitation links work for 7 days. Ask {invite.inviter_name} at {invite.workspace_name} to send a new one.
      </Message>
    );
  }

  const what =
    invite.role === "client"
      ? `review and approve work for ${invite.client_name} from ${invite.workspace_name}`
      : `join ${invite.workspace_name} as a teammate`;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-primary">You&apos;re invited</p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {invite.inviter_name} invited you to {what}
        </h1>
        <p className="text-sm text-muted-foreground">
          This invitation is for <span className="font-medium text-foreground">{invite.email}</span>.
        </p>
      </div>

      {!user && (
        <div className="space-y-3">
          <Button size="lg" className="w-full" asChild>
            <Link href={`/signup?next=${encodeURIComponent(here)}&email=${encodeURIComponent(invite.email)}`}>Create your account</Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full" asChild>
            <Link href={`/login?next=${encodeURIComponent(here)}`}>I already have an account</Link>
          </Button>
        </div>
      )}

      {user && user.email.toLowerCase() !== invite.email && (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex gap-3 text-sm">
            <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p>
              You&apos;re signed in as <span className="font-medium">{user.email}</span>. Sign out, then open this link again and sign in as{" "}
              <span className="font-medium">{invite.email}</span>.
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      )}

      {user && user.email.toLowerCase() === invite.email && <AcceptInviteForm token={token} />}
    </div>
  );
}

function Message({ icon: Icon, title, children }: { icon: typeof Clock; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
