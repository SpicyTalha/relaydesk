import { Suspense } from "react";
import Link from "next/link";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamSidebar } from "@/components/shell/team-sidebar";
import { UserMenu } from "@/components/shell/user-menu";
import { DemoBanner } from "@/components/shell/demo-banner";
import { LogoMark } from "@/components/brand/logo";
import { getProfile, getWorkspaceContext } from "@/lib/data/workspace";
import { ACCENT_SWATCH, getClientSpaces } from "@/lib/data/clients";

// The workspace shell needs the signed-in user (name, role, clients), so entering a workspace
// may block on it. Navigations *between* pages inside a workspace stay instant: the layout
// stays mounted and every page streams in behind its own skeleton.
export const instant = false;

const PLAN_LABEL = { free: "Free plan", pro: "Pro plan", studio: "Studio plan" } as const;

export default function WorkspaceLayout({ children, params }: LayoutProps<"/w/[slug]">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell params={params}>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) {
  const { slug } = await params;
  const [ws, profile] = await Promise.all([getWorkspaceContext(slug), getProfile()]);

  if (!ws.isTeam) {
    // Clients get a focused, single-column portal that works well on a phone.
    const clientName = (await getClientSpaces(ws.id))[0]?.name ?? "";
    return (
      <div className="flex min-h-svh flex-col">
        {ws.isDemo && <DemoBanner slug={slug} role="client" />}
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
            <Link
              href={`/w/${slug}`}
              className="flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <LogoMark className="size-7 shrink-0" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">{clientName}</p>
                <p className="truncate text-xs text-muted-foreground">with {ws.name}</p>
              </div>
            </Link>
            <UserMenu name={profile.fullName} email={profile.email} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="mx-auto w-full max-w-3xl px-4 pb-6 text-xs text-muted-foreground">
          Sample project. Fictional company and data.
        </footer>
      </div>
    );
  }

  const clients = await getClientSpaces(ws.id);
  return (
    <SidebarProvider>
      <TeamSidebar
        slug={slug}
        workspaceName={ws.name}
        planLabel={PLAN_LABEL[ws.plan]}
        isOwner={ws.isOwner}
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          swatch: ACCENT_SWATCH[c.accent],
          // The badge counts what the team must act on: feedback that came back.
          open: c.counts.changes_requested,
        }))}
      />
      <SidebarInset>
        {ws.isDemo && <DemoBanner slug={slug} role={ws.role} />}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-5 md:hidden" />
          <span className="truncate text-sm font-medium md:hidden">{ws.name}</span>
          <div className="ml-auto">
            <UserMenu name={profile.fullName} email={profile.email} />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh" aria-busy="true" aria-label="Loading workspace">
      <div className="hidden w-64 shrink-0 border-r bg-sidebar p-3 md:block">
        <Skeleton className="h-10 w-full" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="h-14 border-b" />
        <div className="space-y-4 p-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
