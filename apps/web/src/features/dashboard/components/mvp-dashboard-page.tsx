"use client";

import Link from "next/link";
import { useState } from "react";
import type { OrganizationDetail } from "@fragment/shared";
import { Button } from "@moyeorak/design-system";
import { Building2, CalendarX, Clock, Download, Pencil } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { useOrganizationQuery } from "@/features/organization/queries/organization-queries";

type ConfirmedSchedule = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  workerName: string;
};

const scheduleSummary = {
  scheduleRange: "2026-06-20 ~ 2026-07-05",
  confirmedScheduleCount: 20,
};

const DAY_LABELS = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
} as const;
const WEEKDAY_LABELS = Object.values(DAY_LABELS);
const CONFIRMED_START_DATE = "2026-06-20";
const CONFIRMED_END_DATE = "2026-07-05";
const CONFIRMED_WORKER_NAMES = [
  "김민지",
  "박준호",
  "이서연",
  "최유나",
  "정도윤",
  "한서준",
  "오하린",
  "강지우",
  "윤태오",
  "임서아",
  "조민규",
  "배수빈",
  "문지훈",
  "신예린",
  "남현우",
  "서다은",
  "권도현",
  "백지민",
  "유시우",
  "홍나연",
];
const CONFIRMED_TIME_RANGES = [
  ["09:00", "13:00"],
  ["10:00", "14:00"],
  ["13:00", "17:00"],
  ["14:00", "18:00"],
  ["18:00", "22:00"],
];
const CONFIRMED_SCHEDULE_DATES = [
  "2026-06-26",
  "2026-06-27",
  "2026-06-29",
  "2026-07-01",
  "2026-07-03",
];
const CONFIRMED_SCHEDULES: ConfirmedSchedule[] = CONFIRMED_WORKER_NAMES.map((workerName, index) => {
  const [startTime, endTime] = CONFIRMED_TIME_RANGES[index % CONFIRMED_TIME_RANGES.length];
  const date =
    index < 17 ? "2026-06-26" : CONFIRMED_SCHEDULE_DATES[index % CONFIRMED_SCHEDULE_DATES.length];

  return {
    id: `confirmed-${index + 1}`,
    date,
    startTime,
    endTime,
    workerName,
  };
});

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + days));
  return nextDate.toISOString().slice(0, 10);
}

function createDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

function getMonday(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const dayIndex = targetDate.getUTCDay();
  const diff = dayIndex === 0 ? -6 : 1 - dayIndex;

  return addDays(date, diff);
}

function createCalendarDates(startDate: string, endDate: string) {
  return createDateRange(getMonday(startDate), addDays(getMonday(endDate), 6));
}

function formatBusinessHourRange(businessHour: OrganizationDetail["businessHours"][number]) {
  if (!businessHour.openTime || !businessHour.closeTime) {
    return "운영 시간 미설정";
  }

  return `${businessHour.openTime} - ${businessHour.closeTime}${
    businessHour.closesNextDay ? " (익일)" : ""
  }`;
}

function getOperationHourGroups(organization: OrganizationDetail) {
  const openBusinessHours = organization.businessHours.filter((businessHour) => {
    return !businessHour.isClosed;
  });

  if (openBusinessHours.length === 0) {
    return [{ dayLabels: "운영일 없음", range: "-" }];
  }

  const rangesByTime = new Map<string, string[]>();

  openBusinessHours.forEach((businessHour) => {
    const range = formatBusinessHourRange(businessHour);
    const dayLabels = rangesByTime.get(range) ?? [];

    rangesByTime.set(range, [...dayLabels, DAY_LABELS[businessHour.dayOfWeek]]);
  });

  return [...rangesByTime.entries()].map(([range, dayLabels]) => ({
    dayLabels: dayLabels.join("/"),
    range,
  }));
}

function getClosedDayLabels(organization: OrganizationDetail) {
  const closedDayLabels = organization.businessHours
    .filter((businessHour) => businessHour.isClosed)
    .map((businessHour) => DAY_LABELS[businessHour.dayOfWeek]);

  if (closedDayLabels.length === 0) {
    return ["없음"];
  }

  return closedDayLabels;
}

export function MvpDashboardPage() {
  const organizationQuery = useOrganizationQuery();
  const [exportMessage, setExportMessage] = useState("");
  const calendarDates = createCalendarDates(CONFIRMED_START_DATE, CONFIRMED_END_DATE);
  const organization = organizationQuery.data;
  const organizationName = organizationQuery.isPending
    ? "조직 정보를 불러오는 중입니다"
    : organizationQuery.isError
      ? "조직 정보를 불러오지 못했습니다"
      : (organization?.name ?? "-");
  const organizationStatus = organizationQuery.isPending
    ? "조회 중"
    : organizationQuery.isError
      ? "확인 필요"
      : "운영 정보";
  const fallbackLabel = organizationQuery.isPending ? "조회 중" : "-";
  const operationHourGroups = organization
    ? getOperationHourGroups(organization)
    : [{ dayLabels: fallbackLabel, range: "-" }];
  const closedDayLabels = organization ? getClosedDayLabels(organization) : [fallbackLabel];

  return (
    <AdminPageShell
      title="대시보드"
      description="현재 조직 정보와 확정된 스케줄을 확인합니다."
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-l-4 border-primary px-6 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
                <h2 className="min-w-0 truncate text-2xl font-semibold text-foreground">
                  {organizationName}
                </h2>
                <Badge variant={organizationQuery.isError ? "destructive" : "secondary"}>
                  {organizationStatus}
                </Badge>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              leadingIcon={<Pencil className="size-4" aria-hidden="true" />}
            >
              <Link href="/organization">조직 수정</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-5 border-t border-border pt-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)] md:divide-x md:divide-border">
            <div className="flex min-w-0 gap-3 md:pr-5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-muted-foreground">
                <Clock className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">운영 시간</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {operationHourGroups.map((operationHourGroup) => (
                    <span
                      key={`${operationHourGroup.dayLabels}-${operationHourGroup.range}`}
                      className="inline-flex items-center gap-2 rounded-md bg-surface-secondary px-3 py-1.5 text-sm text-foreground"
                    >
                      <span className="font-semibold text-primary">
                        {operationHourGroup.dayLabels}
                      </span>
                      <span className="text-muted-foreground">{operationHourGroup.range}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 gap-3 md:pl-5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-muted-foreground">
                <CalendarX className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">매주 휴무</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {closedDayLabels.map((closedDayLabel) => (
                    <span
                      key={closedDayLabel}
                      className="inline-flex min-w-9 items-center justify-center rounded-md bg-surface-secondary px-3 py-1.5 text-sm font-medium text-muted-foreground"
                    >
                      {closedDayLabel}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {exportMessage ? (
        <div className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted-foreground">
          {exportMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-col gap-4 border-b border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">확정 스케줄 달력</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{scheduleSummary.scheduleRange}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              총 {scheduleSummary.confirmedScheduleCount}개 배정이 확정되었습니다.
            </p>
          </div>
          <Button
            type="button"
            variant="brand"
            onClick={() => setExportMessage("확정 스케줄 CSV export가 준비되었습니다.")}
            leadingIcon={<Download className="size-4" aria-hidden="true" />}
          >
            CSV export
          </Button>
        </div>
        <div className="overflow-x-auto p-6">
          <div className="grid min-w-3xl grid-cols-7 border-l border-t border-border">
            {WEEKDAY_LABELS.map((weekday) => (
              <div
                key={weekday}
                className="border-b border-r border-border bg-surface-secondary px-3 py-2 text-center text-xs font-semibold text-muted-foreground"
              >
                {weekday}
              </div>
            ))}
            {calendarDates.map((date) => {
              const inRange = date >= CONFIRMED_START_DATE && date <= CONFIRMED_END_DATE;
              const dateSchedules = CONFIRMED_SCHEDULES.filter(
                (schedule) => schedule.date === date,
              );

              return (
                <div
                  key={date}
                  className={
                    inRange
                      ? "min-h-36 border-b border-r border-border bg-card p-3"
                      : "min-h-36 border-b border-r border-border bg-surface-secondary p-3 opacity-45"
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{date.slice(8, 10)}</p>
                    {inRange ? (
                      <span className="text-xs text-muted-foreground">
                        {dateSchedules.length}명
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-1">
                    {dateSchedules.map((schedule) => (
                      <p key={schedule.id} className="truncate text-xs font-medium text-foreground">
                        {schedule.startTime}-{schedule.endTime} {schedule.workerName}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}
