import Link from "next/link";
import { Info, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { OrganizationEmptyIllustration } from "./organization-empty-illustration";

export function OrganizationEmptyState() {
  return (
    <section className="flex min-h-dvh items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-lg text-center">
        <OrganizationEmptyIllustration />

        <div className="mt-8">
          <h1 className="text-balance text-2xl font-bold text-foreground">
            조직을 등록해 시작하세요
          </h1>
          <p className="mt-4 text-pretty text-sm leading-6 text-muted-foreground">
            아직 등록된 조직이 없어요.
            <br />
            조직을 만들면 스케줄 편성과 급여 계산을 시작할 수 있어요.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-6">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href="/organizations/new">
              <Plus className="size-4" aria-hidden="true" />
              조직 등록하기
            </Link>
          </Button>

          <p className="inline-flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <Info className="size-4" aria-hidden="true" />
            조직은 나중에 조직 관리에서 더 추가할 수 있어요.
          </p>
        </div>
      </div>
    </section>
  );
}
