"use client";

import type { MouseEvent, ReactNode } from "react";

import { FloatingButton } from "@moyeorak/design-system";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  function scrollToTop(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const scrollRoot = document.scrollingElement ?? document.documentElement;
    scrollRoot.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="flex min-h-dvh flex-col max-lg:pl-16">
        <div className="min-w-0 flex-1 bg-background">{children}</div>
      </SidebarInset>
      <FloatingButton type="up" aria-label="위로 이동" onClick={scrollToTop} />
    </SidebarProvider>
  );
}
