import Link from "next/link";
import { Check, MessageSquare } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 outline-none">
          <Logo />
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="text-xs text-muted-foreground">
          Sample project. Fictional company and data. Payments run in Stripe test mode.
        </p>
      </div>
      <ApprovalPreview />
    </div>
  );
}

/** A static picture of the product moment Relaydesk is built around, drawn with real UI pieces. */
function ApprovalPreview() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden overflow-hidden border-l bg-[radial-gradient(120%_80%_at_80%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_60%)] bg-muted/50 lg:flex lg:items-center lg:justify-center"
    >
      <div className="w-full max-w-md space-y-4 px-10">
        <p className="text-sm font-medium text-muted-foreground">What your client sees</p>
        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Northwind Coffee · Spring menu</p>
              <p className="mt-1 font-semibold">Menu board, version 3</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-status-review/12 px-2.5 py-1 text-xs font-medium text-status-review">
              <span className="size-1.5 rounded-full bg-status-review" />
              Waiting for you
            </span>
          </div>
          <div className="mt-4 grid aspect-[16/9] place-items-center rounded-lg border bg-[linear-gradient(135deg,oklch(0.93_0.04_60),oklch(0.86_0.07_45))]">
            <div className="w-2/3 space-y-2 rounded-md bg-white/85 p-3 shadow-sm">
              <div className="h-2.5 w-1/2 rounded bg-stone-800/80" />
              <div className="h-1.5 w-full rounded bg-stone-500/40" />
              <div className="h-1.5 w-5/6 rounded bg-stone-500/40" />
              <div className="h-1.5 w-4/6 rounded bg-stone-500/40" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" />
            <span>3 comments · due Friday</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex h-9 items-center justify-center rounded-lg border text-sm font-medium">Request changes</div>
            <div className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-status-approved text-sm font-medium text-white">
              <Check className="size-4" />
              Approve
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Every decision is saved with a name and a timestamp, so &ldquo;looks good&rdquo; never gets lost in email again.
        </p>
      </div>
    </aside>
  );
}
