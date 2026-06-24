"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Archive, CalendarDays, Clock3, Home, ListChecks, LogOut, Users } from "lucide-react";

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
import { useAuthMeQuery, useLogoutMutation } from "@/features/auth/queries/auth-session";

const primaryNavigationItems = [
  { title: "대시보드", href: "/dashboard", icon: Home },
  { title: "스케줄", href: "/schedules", icon: CalendarDays },
  { title: "보관함", href: "/schedule-history", icon: Archive },
];

const operationsNavigationItems = [
  { title: "근무자", href: "/workers", icon: Users },
  { title: "가능 시간", href: "/availability", icon: Clock3 },
  { title: "최소 인원 조건", href: "/staffing-rules", icon: ListChecks },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: authMe } = useAuthMeQuery();
  const logoutMutation = useLogoutMutation();

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="justify-between gap-3 border-b border-border">
        <SidebarTrigger className="shrink-0" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarMenu>
            {primaryNavigationItems.map((item) => (
              <NavigationMenuItem key={item.href} item={item} pathname={pathname} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>운영 설정</SidebarGroupLabel>
          <SidebarMenu>
            {operationsNavigationItems.map((item) => (
              <NavigationMenuItem key={item.href} item={item} pathname={pathname} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border">
        <div className="min-w-0 px-3 py-2 group-data-[state=collapsed]/sidebar:sr-only">
          <p className="truncate text-sm font-semibold text-foreground">{authMe?.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{authMe?.user.email}</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              title="로그아웃"
              disabled={logoutMutation.isPending}
              onClick={handleLogout}
            >
              <LogOut aria-hidden="true" />
              <span>{logoutMutation.isPending ? "로그아웃 중" : "로그아웃"}</span>
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
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={item.href} title={item.title} aria-current={isActive ? "page" : undefined}>
          <Icon aria-hidden="true" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
