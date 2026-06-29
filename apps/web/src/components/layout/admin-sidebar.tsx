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
import { useAuthMeQuery, useLogoutMutation } from "@/features/auth/queries/auth-session";

type AdminSidebarProps = {
  navigation?: "default" | "hidden";
};

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

export function AdminSidebar({ navigation = "default" }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: authMe } = useAuthMeQuery();
  const logoutMutation = useLogoutMutation();

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="justify-between gap-3 border-b border-border">
        <SidebarTrigger className="shrink-0 hover:bg-fill-brand-subtler hover:text-fg-neutral-strong" />
      </SidebarHeader>

      {navigation === "default" ? (
        <SidebarContent>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.href} item={item} pathname={pathname} />
            ))}
          </SidebarMenu>
        </SidebarContent>
      ) : (
        <SidebarContent aria-hidden="true" />
      )}
      <SidebarFooter className="border-t border-border">
        <div className="flex min-w-0 items-center gap-2 px-3 py-2 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0">
          <div className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:sr-only">
            <p className="truncate text-sm font-semibold text-foreground">{authMe?.user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{authMe?.user.email}</p>
          </div>
          <button
            type="button"
            aria-label="로그아웃"
            title="로그아웃"
            disabled={logoutMutation.isPending}
            onClick={handleLogout}
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-fill-brand-subtler hover:text-fg-neutral-strong"
          >
            <LogOut className="size-5" aria-hidden="true" />
          </button>
        </div>
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
