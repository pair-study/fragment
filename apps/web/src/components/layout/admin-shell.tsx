"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const hasOrganizations = pathname !== "/organizations/empty";

  return (
    <SidebarProvider>
      <AdminSidebar hasOrganizations={hasOrganizations} />
      <SidebarInset className="flex min-h-dvh flex-col">
        <div className="min-w-0 flex-1 bg-background">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
