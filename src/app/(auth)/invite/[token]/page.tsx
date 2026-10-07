import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CheckIcon, ClockIcon, LinkSimpleIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { cn } from "cn";
import { AUTH_BUTTON, AuthHeading } from "@/components/auth/signup-steps";
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
      <Message icon={LinkSimpleIcon} title="This invitation isn't valid">
        It may have been used already or revoked. Ask the person who invited you for a new link.
        <Button variant="outline" className={cn(AUTH_BUTTON, "mt-6 bg-white")} asChild>
          <Link href="/login">Go to sign in</Link>
        </Button>
      </Message>
    );
  }

  if (invite.expired) {
    return (
      <Message icon={ClockIcon} title="This invitation has expired">
        Invitation links work for 7 days. Ask {invite.inviter_name} at {invite.workspace_name} to send a new one.
      </Message>
    );
  }

  const isClient = invite.role === "client";
  const what = isClient
    ? `review and approve work for ${invite.client_name} from ${invite.workspace_name}`
    : `join ${invite.workspace_name} as a teammate`;
  // What accepting means, so nobody has to guess what they're signing up for.
  const youCan = isClient
    ? [
        `See the work ${invite.workspace_name} shares with ${invite.client_name}, and nothing else`,
        "Approve it, or mark it up with notes",
        "Free for you, on any phone, no app to install",
      ]
    : [`See every client and deliverable at ${invite.workspace_name}`, "Upload versions and ask clients for sign-off", "Free for you: your studio covers the seat"];

  return (
    <div className="space-y-7">
      <p className="w-fit -rotate-2 bg-process-yellow px-3 pt-1.5 pb-0.5 font-pen text-2xl leading-none text-pen shadow-[0_8px_14px_-8px_rgb(0_0_0/0.4)]">
        you&apos;re invited!
      </p>
      <AuthHeading small title={`${invite.inviter_name} invited you to ${what}`}>
        This invitation is for <span className="font-semibold text-ink">{invite.email}</span>.
      </AuthHeading>
      <ul className="space-y-2.5 rounded-2xl border border-ink/10 bg-white p-4 text-sm">
        {youCan.map((line) => (
          <li key={line} className="flex gap-2.5">
            <CheckIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-status-approved" aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>

      {!user && (
        <div className="space-y-3">
          <Button size="lg" className={AUTH_BUTTON} asChild>
            <Link href={`/signup?next=${encodeURIComponent(here)}&email=${encodeURIComponent(invite.email)}`}>Create your account</Link>
          </Button>
          <Button size="lg" variant="outline" className={cn(AUTH_BUTTON, "bg-white")} asChild>
            <Link href={`/login?next=${encodeURIComponent(here)}`}>I already have an account</Link>
          </Button>
        </div>
      )}

      {user && user.email.toLowerCase() !== invite.email && (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex gap-3 text-sm">
            <UserIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p>
              You&apos;re signed in as <span className="font-medium">{user.email}</span>, but this invitation is for{" "}
              <span className="font-medium">{invite.email}</span>.
            </p>
          </div>
          <form action={signOut}>
            <input type="hidden" name="next" value={here} />
            <Button type="submit" variant="outline" className={cn(AUTH_BUTTON, "bg-white")}>
              Sign out and continue
            </Button>
          </form>
        </div>
      )}

      {user && user.email.toLowerCase() === invite.email && <AcceptInviteForm token={token} />}
    </div>
  );
}

function Message({ icon: Icon, title, children }: { icon: typeof ClockIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <span className="grid size-11 place-items-center rounded-full bg-ink text-paper">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <AuthHeading title={title} />
      <div className="text-[15px] text-ink/65">{children}</div>
    </div>
  );
}
