"use client";

import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="flex min-h-dvh flex-col max-lg:pl-16">
        <div className="min-w-0 flex-1 bg-background">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
