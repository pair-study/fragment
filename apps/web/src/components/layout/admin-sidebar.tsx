"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, Home, IdCard, Users, WalletCards } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "홈", href: "/home", icon: Home, requiresOrg: false },
  { title: "근무일정", href: "/schedule", icon: CalendarDays, requiresOrg: true },
  { title: "근태관리", href: "/attendance", icon: IdCard, requiresOrg: true },
  { title: "급여정산", href: "/payroll", icon: WalletCards, requiresOrg: true },
  { title: "인력관리", href: "/members", icon: Users, requiresOrg: true },
  { title: "조직 관리", href: "/organizations", icon: Building2, requiresOrg: false },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AdminSidebarProps = {
  hasOrganizations?: boolean;
};

export function AdminSidebar({ hasOrganizations = true }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="justify-between gap-3 border-b border-border">
        <Link href="/home" className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground shadow-sm">
            일
          </span>
          <span className="min-w-0 text-sm font-bold text-foreground group-data-[state=collapsed]/sidebar:sr-only">
            일감 관리자
          </span>
        </Link>
        <SidebarTrigger className="shrink-0" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarMenu>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const disabled = item.requiresOrg && !hasOrganizations;
              const href = item.href;
              const isActive = !disabled && isActivePath(pathname, href);

              return (
                <SidebarMenuItem key={item.href}>
                  {disabled ? (
                    <SidebarMenuButton
                      className={cn("cursor-not-allowed opacity-40")}
                      aria-disabled="true"
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={href}
                        title={item.title}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon aria-hidden="true" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
