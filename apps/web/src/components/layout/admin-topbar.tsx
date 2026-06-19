"use client";

import Link from "next/link";
import { Building2, LogOut, UserCircle } from "lucide-react";

import { Button } from "@moyeorak/design-system";

type AdminTopbarProps = {
  hasOrganizations?: boolean;
};

export function AdminTopbar({ hasOrganizations = true }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-(--layout-topbar-height) shrink-0 items-center justify-between gap-4 border-b border-border bg-surface-canvas px-5 shadow-sticky">
      <div className="flex min-w-0 items-center gap-4">
        {hasOrganizations ? (
          <div className="inline-flex h-10 max-w-72 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold text-text-ink shadow-sm">
            <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">강남 스터디 카페</span>
          </div>
        ) : (
          <Button asChild variant="outline">
            <Link href="/organizations/new">매장 생성</Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm sm:inline-flex">
          <UserCircle className="size-5 text-muted-foreground" aria-hidden="true" />
          관리자
        </div>
        <Button asChild variant="ghost">
          <Link href="/login">
            <LogOut className="size-4" aria-hidden="true" />
            로그아웃
          </Link>
        </Button>
      </div>
    </header>
  );
}
