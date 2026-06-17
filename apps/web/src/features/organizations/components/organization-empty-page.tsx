import Link from "next/link";
import { Building2, CheckCircle2, Plus } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const nextSteps = ["사업자등록번호", "도로명 주소", "GPS 허용 반경", "근무 유형"];

export function OrganizationEmptyPage() {
  return (
    <AdminPageShell
      title="조직 관리"
      description="사업자 정보, GPS 반경, 휴무일 같은 조직 운영 기준을 관리하는 화면입니다."
      contentClassName="flex flex-col gap-6"
      descriptionClassName="max-w-2xl"
    >
      <Card className="min-h-[320px]">
        <CardContent className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-center">
          <div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="size-6" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-balance text-xl font-bold text-foreground">
              운영할 조직이 아직 없어요
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-6 text-muted-foreground">
              사업자등록번호, 주소, GPS 반경, 근무 유형을 먼저 등록하면 근무 일정, 근태, 급여 정산
              메뉴를 바로 사용할 수 있어요.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6">
                <Link href="/organizations/new">
                  <Plus className="size-4" aria-hidden="true" />
                  조직 등록하기
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-secondary p-5">
            <p className="text-sm font-semibold text-foreground">등록에 필요한 정보</p>
            <ul className="mt-4 space-y-3">
              {nextSteps.map((step) => (
                <li key={step} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
