"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, CalendarDays, Clock3, Home, ListChecks, LogOut, Users } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "대시보드", href: "/dashboard", icon: Home },
  { title: "스케줄", href: "/schedules", icon: CalendarDays },
  { title: "보관함", href: "/schedule-history", icon: Archive },
  { title: "근무자 관리", href: "/workers", icon: Users },
  { title: "가능 시간 관리", href: "/availability", icon: Clock3 },
  { title: "최소 인원 조건", href: "/staffing-rules", icon: ListChecks },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="justify-between gap-3 border-b border-border">
        <SidebarTrigger className="shrink-0 hover:bg-fill-brand-subtler hover:text-fg-neutral-strong" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <NavigationMenuItem key={item.href} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="hover:bg-fill-brand-subtler hover:text-fg-neutral-strong"
            >
              <Link href="/login" title="로그아웃">
                <LogOut aria-hidden="true" />
                <span>로그아웃</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

type NavigationItem = {
  title: string;
  href: string;
  icon: typeof Home;
};

type NavigationMenuItemProps = {
  item: NavigationItem;
  pathname: string;
};

function NavigationMenuItem({ item, pathname }: NavigationMenuItemProps) {
  const Icon = item.icon;
  const isActive = isActivePath(pathname, item.href);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="hover:bg-fill-brand-subtler hover:text-fg-neutral-strong"
      >
        <Link href={item.href} title={item.title} aria-current={isActive ? "page" : undefined}>
          <Icon aria-hidden="true" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
