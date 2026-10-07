import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyWorkspaces } from "@/lib/data/workspace";

export const metadata: Metadata = { title: "Your workspaces" };

/** Sends people where they belong: onboarding, their only workspace, or a picker. */
export default function WorkspacesPage() {
  return (
    <div className="flex min-h-svh flex-col px-5 py-6 sm:px-10">
      <Logo />
      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-md">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <WorkspacePicker />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function WorkspacePicker() {
  const workspaces = await getMyWorkspaces();
  if (workspaces.length === 0) redirect("/onboarding");
  if (workspaces.length === 1) redirect(`/w/${workspaces[0].slug}`);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Choose a workspace</h1>
      <ul className="divide-y rounded-xl border bg-card">
        {workspaces.map((w) => (
          <li key={w.id}>
            <Link
              href={`/w/${w.slug}`}
              className="flex items-center justify-between gap-4 px-4 py-3 outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
            >
              <div>
                <p className="font-medium">{w.name}</p>
                <p className="text-sm text-muted-foreground">{w.role === "client" ? "Client access" : `You're ${w.role === "owner" ? "the owner" : "a team member"}`}</p>
              </div>
              <CaretRightIcon className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
