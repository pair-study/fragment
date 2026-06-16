"use client";

import Link from "next/link";
import {
  Building2,
  Check,
  ChevronsUpDown,
  LogOut,
  Plus,
  Settings,
  UserCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const organizations = ["스타벅스 강남점", "투썸플레이스 역삼점", "CU 테헤란점"];

type AdminTopbarProps = {
  hasOrganizations?: boolean;
};

export function AdminTopbar({ hasOrganizations = true }: AdminTopbarProps) {
  const currentOrganization = hasOrganizations ? organizations[0] : null;

  return (
    <header className="sticky top-0 z-20 flex h-(--layout-topbar-height) shrink-0 items-center justify-between gap-4 border-b border-border bg-surface-canvas px-5 shadow-sticky">
      <div className="flex min-w-0 items-center gap-4">
        {hasOrganizations ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-10 w-60 items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold text-text-ink shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex min-w-0 items-center gap-2">
                <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{currentOrganization}</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="w-72 rounded-lg p-1">
              <DropdownMenuLabel>조직 전환</DropdownMenuLabel>
              {organizations.map((organization) => {
                const isSelected = organization === currentOrganization;

                return (
                  <DropdownMenuItem key={organization} className="h-10 text-sm font-medium">
                    <span className="truncate">{organization}</span>
                    {isSelected ? <Check className="ml-auto size-4 text-primary" /> : null}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="h-10 text-sm font-medium">
                <Link href="/organizations/new">
                  <Plus className="size-4" aria-hidden="true" />
                  <span>조직 추가</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="outline" className="h-10">
            <Link href="/organizations/new">
              <Plus className="size-4" aria-hidden="true" />
              조직 등록
            </Link>
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <UserCircle className="size-5 text-muted-foreground" aria-hidden="true" />
          <span className="hidden sm:inline">관리자</span>
          <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-56">
          <DropdownMenuLabel>
            <span className="block text-sm font-semibold text-foreground">관리자</span>
            <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">
              admin@ilgam.co.kr
            </span>
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/account">
              <Settings className="size-4" aria-hidden="true" />
              계정 설정
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="size-4" aria-hidden="true" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
