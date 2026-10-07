"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCardIcon, GearIcon, PlusIcon, TrayIcon, UsersIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { LogoMark } from "@/components/brand/logo";
import { AddClientDialog } from "./add-client-dialog";

type SidebarClient = { id: string; name: string; swatch: string; open: number };

/** The plan's chip colour, matching the swatches on the pricing page. */
const PLAN_SWATCH = { free: "bg-process-yellow", pro: "bg-process-magenta", studio: "bg-white" } as const;

/** Active items get a process-yellow tick on the left edge. */
const ITEM = "data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_var(--color-process-yellow)]";

export function TeamSidebar({
  slug,
  workspaceName,
  plan,
  planLabel,
  clients,
  isOwner,
}: {
  slug: string;
  workspaceName: string;
  plan: "free" | "pro" | "studio";
  planLabel: string;
  clients: SidebarClient[];
  isOwner: boolean;
}) {
  const pathname = usePathname();
  const base = `/w/${slug}`;
  const nav = [
    { href: base, label: "Overview", icon: TrayIcon, exact: true },
    { href: `${base}/team`, label: "Team", icon: UsersIcon },
    { href: `${base}/settings`, label: "Settings", icon: GearIcon },
    ...(isOwner ? [{ href: `${base}/billing`, label: "Billing", icon: CreditCardIcon }] : []),
  ];
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <Link
          href={base}
          className="flex items-center gap-2.5 rounded-lg px-2 py-2 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <LogoMark className="size-8 shrink-0 text-white" />
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] leading-tight font-extrabold tracking-[-0.02em] text-white">{workspaceName}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/55">
              <span aria-hidden="true" className={cn("size-2.5 rounded-[2px]", PLAN_SWATCH[plan])} />
              {planLabel}
            </p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href, item.exact)} className={ITEM}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Clients</SidebarGroupLabel>
          <AddClientDialog
            key={pathname}
            slug={slug}
            trigger={
              <SidebarGroupAction title="Add client">
                <PlusIcon />
                <span className="sr-only">Add client</span>
              </SidebarGroupAction>
            }
          />
          <SidebarGroupContent>
            <SidebarMenu>
              {clients.length === 0 && (
                <li className="px-2 py-1.5 text-xs text-white/50">No clients yet. Add your first one.</li>
              )}
              {clients.map((c) => {
                const href = `${base}/c/${c.id}`;
                return (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(href)} className={ITEM}>
                      <Link href={href}>
                        <span className={cn("size-2 shrink-0 rounded-full", c.swatch)} aria-hidden="true" />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    {c.open > 0 && (
                      <SidebarMenuBadge
                        className="rounded-full bg-process-yellow px-1.5 font-semibold text-ink tabular peer-hover/menu-button:text-ink peer-data-[active=true]/menu-button:text-ink"
                        aria-label={`${c.open} came back with changes`}
                      >
                        {c.open}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="px-2 text-[11px] leading-snug text-white/40">
          Sample project. Fictional data. Stripe test mode.
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
