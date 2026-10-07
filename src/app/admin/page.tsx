import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { cn } from "cn";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminOverview } from "@/lib/data/admin";
import { currentTime } from "@/lib/now";
import { timeAgo } from "@/lib/format";
import { SuspendButton } from "./suspend-button";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="min-h-svh bg-paper text-ink">
      <header className="bg-ink text-paper">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <Logo className="text-paper" />
            <span className="rounded-full bg-process-yellow px-2.5 py-0.5 text-xs font-bold text-ink">Platform admin</span>
          </div>
          <Link href="/w" className="text-sm font-semibold text-paper/70 hover:text-paper">
            Back to the app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10">
        <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-2xl" />}>
          <Overview searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

const OUTCOME: Record<string, string> = {
  applied: "bg-status-approved/12 text-status-approved",
  recorded: "bg-status-review/12 text-status-review",
  ignored: "bg-muted text-muted-foreground",
};

async function Overview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const includeDemo = (await searchParams).demo === "1";
  const [now, data] = await Promise.all([currentTime(), getAdminOverview({ includeDemo })]);
  const { stats } = data;
  const tiles = [
    { label: "Studios", value: stats.studios, note: "real sign-ups", bar: "bg-ink" },
    { label: "Paying studios", value: stats.paying, note: "Pro or Studio", bar: "bg-process-magenta" },
    { label: "MRR (test mode)", value: `$${stats.mrr.toLocaleString("en-US")}`, note: "list price, active subscriptions", bar: "bg-status-approved" },
    { label: "Demo copies", value: stats.demoCopies, note: "deleted after 24 hours", bar: "bg-process-yellow" },
    { label: "Webhooks, 24 h", value: stats.events24h, note: `${stats.duplicates24h} duplicate ${stats.duplicates24h === 1 ? "delivery" : "deliveries"} skipped`, bar: "bg-process-cyan" },
  ];

  return (
    <div className="space-y-10">
      <h1 className="font-display text-[2.5rem] leading-none font-extrabold tracking-[-0.04em]">Admin</h1>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="relative overflow-hidden rounded-xl bg-card p-4 pt-5 shadow-[0_0_0_1px_rgb(21_23_26/0.07)]">
            <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-1.5", t.bar)} />
            <dt className="text-sm text-muted-foreground">{t.label}</dt>
            <dd className="mt-2 font-display text-4xl leading-none font-extrabold tracking-[-0.05em] tabular">{t.value}</dd>
            <dd className="mt-2 text-xs text-muted-foreground">{t.note}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="studios" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="studios" className="font-display text-2xl font-extrabold tracking-[-0.03em]">
            Studios
          </h2>
          <Link href={includeDemo ? "/admin" : "/admin?demo=1"} className="text-sm font-semibold underline underline-offset-4">
            {includeDemo ? "Hide demo copies" : `Show demo copies (${stats.demoCopies})`}
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Studio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">People</TableHead>
                <TableHead className="text-right">Clients</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.studios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No studios yet.
                  </TableCell>
                </TableRow>
              )}
              {data.studios.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <p className="font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">/{w.slug}</p>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{w.plan}</span>
                    {w.subscription && w.subscription !== "none" && <span className="ml-1.5 text-xs text-muted-foreground">{w.subscription.replace("_", " ")}</span>}
                  </TableCell>
                  <TableCell className="text-right tabular">{w.people}</TableCell>
                  <TableCell className="text-right tabular">{w.clients}</TableCell>
                  <TableCell className="text-muted-foreground">{timeAgo(w.createdAt, now)}</TableCell>
                  <TableCell>
                    {w.suspendedAt ? <Badge variant="destructive">Suspended</Badge> : w.isDemo ? <Badge variant="secondary">Demo copy</Badge> : <Badge variant="outline">Active</Badge>}
                  </TableCell>
                  <TableCell className="text-right">{!w.isDemo && <SuspendButton workspaceId={w.id} name={w.name} suspended={!!w.suspendedAt} />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="webhooks" className="space-y-3">
          <h2 id="webhooks" className="font-display text-2xl font-extrabold tracking-[-0.03em]">
            Stripe webhook log
          </h2>
          <p className="text-sm text-muted-foreground">
            Every event is verified, then stored once by its id. Redeliveries are counted and skipped, so a plan can never change twice.
          </p>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Studio</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No webhook events yet.
                    </TableCell>
                  </TableRow>
                )}
                {data.events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <p className="font-medium">{e.type}</p>
                      {e.summary && <p className="max-w-xs truncate text-xs text-muted-foreground">{e.summary}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.studio ?? "None"}</TableCell>
                    <TableCell>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", OUTCOME[e.outcome])}>{e.outcome}</span>
                      {e.deliveries > 1 && (
                        <span className="ml-1.5 rounded-full bg-process-yellow px-2 py-0.5 text-xs font-semibold tabular">
                          {e.deliveries}× delivered
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{timeAgo(e.received_at, now)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section aria-labelledby="audit" className="space-y-3">
          <h2 id="audit" className="font-display text-2xl font-extrabold tracking-[-0.03em]">
            Audit log
          </h2>
          <p className="text-sm text-muted-foreground">What platform admins did, and why.</p>
          <ol className="divide-y rounded-xl border bg-card">
            {data.audit.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Nothing yet.</li>}
            {data.audit.map((a) => {
              const meta = a.metadata as { reason?: string; name?: string };
              return (
                <li key={a.id} className="space-y-1 p-4 text-sm">
                  <p>
                    <span className="font-medium">{a.actor}</span> {a.action === "studio.suspended" ? "suspended" : a.action === "studio.unsuspended" ? "lifted the suspension on" : a.action}{" "}
                    <span className="font-medium">{a.studio ?? meta.name ?? "a studio"}</span>
                  </p>
                  {meta.reason && <p className="border-l-2 pl-2 text-muted-foreground italic">&ldquo;{meta.reason}&rdquo;</p>}
                  <p className="text-xs text-muted-foreground">{timeAgo(a.created_at, now)}</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
