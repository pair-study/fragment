import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  // TODO: API 연동 후 서버에서 조직 목록을 가져와 실제 조직 유무를 전달
  // 와이어프레임 단계에서는 기본 레이아웃을 조직 있음 상태로 본다.
  const hasOrganizations = true;

  return (
    <SidebarProvider>
      <AdminSidebar hasOrganizations={hasOrganizations} />
      <SidebarInset className="flex min-h-dvh flex-col">
        <AdminTopbar hasOrganizations={hasOrganizations} />
        <div className="min-w-0 flex-1 bg-background">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
