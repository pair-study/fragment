import Link from "next/link";
import { Info, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrganizationEmptyIllustration } from "@/features/onboarding/components/organization-empty-illustration";

export function OrganizationEmptyPage() {
  return (
    <main className="min-h-full bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground text-balance">조직 관리</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
            사업자 정보, GPS 반경, 휴무일 같은 조직 운영 기준을 관리하는 화면입니다.
          </p>
        </header>

        <section className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 shadow-card">
          <div className="w-full max-w-lg text-center">
            <OrganizationEmptyIllustration />

            <div className="mt-8">
              <h2 className="text-2xl font-bold text-foreground text-balance">
                운영할 조직이 아직 없어요
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground text-pretty">
                첫 조직을 등록하면 근무 일정, 근태, 급여 정산 메뉴를 바로 사용할 수 있어요.
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
                조직은 여러 개 등록한 뒤 상단에서 전환할 수 있어요.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
