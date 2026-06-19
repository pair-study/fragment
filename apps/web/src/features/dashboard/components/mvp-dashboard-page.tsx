import Link from "next/link";
import { Badge, Button } from "@moyeorak/design-system";
import { CalendarDays, Clock3, ListChecks, Users } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";

type SetupMetric = {
  label: string;
  value: string;
  href: string;
  icon: typeof Users;
};

const setupMetrics: SetupMetric[] = [
  {
    label: "근무자",
    value: "3명",
    href: "/workers",
    icon: Users,
  },
  {
    label: "가능 시간",
    value: "3개",
    href: "/availability",
    icon: Clock3,
  },
  {
    label: "최소 인원 조건",
    value: "3개",
    href: "/staffing-rules",
    icon: ListChecks,
  },
];

const dashboardSummary = {
  organizationName: "강남 스터디 카페",
  operationHours: "09:00 - 22:00",
  weekRange: "2026-06-22 ~ 2026-06-28",
  scheduleStatus: "작성 중",
  unfilledConditionCount: 1,
};

export function MvpDashboardPage() {
  return (
    <AdminPageShell
      title="대시보드"
      description="현재 매장의 스케줄 준비 상태와 이번 주 운영 현황을 확인합니다."
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {dashboardSummary.organizationName}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              운영 시간 {dashboardSummary.operationHours}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/schedules">
              <CalendarDays className="size-4" aria-hidden="true" />
              이번 주 스케줄 보기
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {setupMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Link
              key={metric.href}
              href={metric.href}
              className="rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:bg-accent"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-lg bg-surface-secondary text-muted-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">이번 주 스케줄</h2>
              <Badge variant="neutral-weak">{dashboardSummary.scheduleStatus}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{dashboardSummary.weekRange}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              미충족 조건 {dashboardSummary.unfilledConditionCount}개가 있습니다.
            </p>
          </div>
          <Button asChild variant="brand">
            <Link href="/schedules">스케줄 보러 가기</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-base font-semibold text-foreground">다음 작업</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          이번 주 스케줄이 작성 중입니다. 스케줄 화면에서 미충족 조건을 확인하고 필요한 배정을
          조정한 뒤 확정하세요.
        </p>
        <div className="mt-5">
          <Button asChild variant="outline">
            <Link href="/schedules">스케줄 조정하기</Link>
          </Button>
        </div>
      </section>
    </AdminPageShell>
  );
}
