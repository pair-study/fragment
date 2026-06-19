"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock3, Home, ListChecks, Users } from "lucide-react";

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

const primaryNavigationItems = [
  { title: "대시보드", href: "/dashboard", icon: Home, requiresOrg: true },
  { title: "스케줄", href: "/schedules", icon: CalendarDays, requiresOrg: true },
];

const operationsNavigationItems = [
  { title: "근무자", href: "/workers", icon: Users, requiresOrg: true },
  { title: "가능 시간", href: "/availability", icon: Clock3, requiresOrg: true },
  { title: "최소 인원 조건", href: "/staffing-rules", icon: ListChecks, requiresOrg: true },
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
            {primaryNavigationItems.map((item) => (
              <NavigationMenuItem
                key={item.href}
                item={item}
                pathname={pathname}
                hasOrganizations={hasOrganizations}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>운영 설정</SidebarGroupLabel>
          <SidebarMenu>
            {operationsNavigationItems.map((item) => (
              <NavigationMenuItem
                key={item.href}
                item={item}
                pathname={pathname}
                hasOrganizations={hasOrganizations}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

type NavigationItem = {
  title: string;
  href: string;
  icon: typeof Home;
  requiresOrg: boolean;
};

type NavigationMenuItemProps = {
  item: NavigationItem;
  pathname: string;
  hasOrganizations: boolean;
};

function NavigationMenuItem({ item, pathname, hasOrganizations }: NavigationMenuItemProps) {
  const Icon = item.icon;
  const disabled = item.requiresOrg && !hasOrganizations;
  const isActive = !disabled && isActivePath(pathname, item.href);

  return (
    <SidebarMenuItem>
      {disabled ? (
        <SidebarMenuButton className={cn("cursor-not-allowed opacity-40")} aria-disabled="true">
          <Icon aria-hidden="true" />
          <span>{item.title}</span>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton asChild isActive={isActive}>
          <Link href={item.href} title={item.title} aria-current={isActive ? "page" : undefined}>
            <Icon aria-hidden="true" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}
