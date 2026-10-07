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

export function TeamSidebar({
  slug,
  workspaceName,
  planLabel,
  clients,
  isOwner,
}: {
  slug: string;
  workspaceName: string;
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
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <LogoMark className="size-7 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{workspaceName}</p>
            <p className="text-xs text-muted-foreground">{planLabel}</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href, item.exact)}>
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
                <li className="px-2 py-1.5 text-xs text-muted-foreground">No clients yet. Add your first one.</li>
              )}
              {clients.map((c) => {
                const href = `${base}/c/${c.id}`;
                return (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(href)}>
                      <Link href={href}>
                        <span className={cn("size-2 shrink-0 rounded-full", c.swatch)} aria-hidden="true" />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    {c.open > 0 && (
                      <SidebarMenuBadge className="tabular" aria-label={`${c.open} open`}>
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
        <p className="px-2 text-[11px] leading-snug text-muted-foreground">
          Sample project. Fictional data. Stripe test mode.
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
