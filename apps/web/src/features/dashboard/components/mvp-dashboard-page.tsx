"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { OrganizationDetail, ScheduleAssignment } from "@fragment/shared";
import { Button } from "@moyeorak/design-system";
import { Building2, CalendarX, Clock, Download, Pencil } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { useDashboardQuery } from "@/features/dashboard/queries/dashboard-queries";
import { useExportScheduleHistoryCsvMutation } from "@/features/schedule-history/queries/schedule-history-queries";
import {
  ConfirmedScheduleCalendar,
  type ConfirmedScheduleCalendarItem,
} from "@/features/schedules/components/confirmed-schedule-calendar";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { formatScheduleAssignmentTime } from "@/lib/schedule-display";

const DAY_LABELS = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
} as const;

function formatScheduleRange(startDate: string, endDate: string) {
  return `${startDate} ~ ${endDate}`;
}

function createCsvFileName(startDate: string, endDate: string) {
  return `schedule-${startDate}-${endDate}.csv`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function scheduleAssignmentToCalendarItem(
  assignment: ScheduleAssignment,
): ConfirmedScheduleCalendarItem {
  return {
    date: assignment.workDate,
    endTime: formatScheduleAssignmentTime(assignment.workDate, assignment.endsAt),
    id: assignment.id,
    startTime: formatScheduleAssignmentTime(assignment.workDate, assignment.startsAt),
    workerName: assignment.workerNameSnapshot,
  };
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
  const dashboardQuery = useDashboardQuery();
  const exportScheduleHistoryCsvMutation = useExportScheduleHistoryCsvMutation();
  const [exportMessage, setExportMessage] = useState("");
  const organization = dashboardQuery.data?.organization;
  const latestConfirmedSchedule = dashboardQuery.data?.latestConfirmedSchedule ?? null;
  const latestConfirmedSchedules = useMemo(
    () => latestConfirmedSchedule?.assignments.map(scheduleAssignmentToCalendarItem) ?? [],
    [latestConfirmedSchedule],
  );
  const organizationName = dashboardQuery.isPending
    ? "조직 정보를 불러오는 중입니다"
    : dashboardQuery.isError
      ? "조직 정보를 불러오지 못했습니다"
      : (organization?.name ?? "-");
  const organizationStatus = dashboardQuery.isPending
    ? "조회 중"
    : dashboardQuery.isError
      ? "확인 필요"
      : "운영 정보";
  const fallbackLabel = dashboardQuery.isPending ? "조회 중" : "-";
  const operationHourGroups = organization
    ? getOperationHourGroups(organization)
    : [{ dayLabels: fallbackLabel, range: "-" }];
  const closedDayLabels = organization ? getClosedDayLabels(organization) : [fallbackLabel];
  const canExportSchedule =
    latestConfirmedSchedule !== null && !exportScheduleHistoryCsvMutation.isPending;

  const handleExportSchedule = async () => {
    if (!latestConfirmedSchedule) {
      return;
    }

    setExportMessage("");

    try {
      const blob = await exportScheduleHistoryCsvMutation.mutateAsync(latestConfirmedSchedule.id);

      downloadBlob(
        blob,
        createCsvFileName(latestConfirmedSchedule.startDate, latestConfirmedSchedule.endDate),
      );
      setExportMessage("CSV 파일을 다운로드했습니다.");
    } catch (error) {
      setExportMessage(getApiErrorMessage(error, "CSV 다운로드에 실패했습니다."));
    }
  };

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
                <Badge variant={dashboardQuery.isError ? "destructive" : "secondary"}>
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

          <div className="mt-6 grid gap-5 border-t border-border pt-5 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)] md:divide-x md:divide-border">
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
              <h2 className="text-base font-semibold text-foreground">최근 확정 스케줄</h2>
            </div>
            {dashboardQuery.isPending ? (
              <p className="mt-2 text-sm text-muted-foreground">
                확정 스케줄 정보를 불러오는 중입니다.
              </p>
            ) : dashboardQuery.isError ? (
              <p className="mt-2 text-sm text-muted-foreground">
                확정 스케줄 정보를 불러오지 못했습니다.
              </p>
            ) : latestConfirmedSchedule ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatScheduleRange(
                    latestConfirmedSchedule.startDate,
                    latestConfirmedSchedule.endDate,
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  총 {latestConfirmedSchedule.assignments.length}개 배정이 확정되었습니다.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">아직 확정된 스케줄이 없습니다.</p>
            )}
          </div>
          <Button
            type="button"
            variant="brand"
            onClick={handleExportSchedule}
            disabled={!canExportSchedule}
            leadingIcon={<Download className="size-4" aria-hidden="true" />}
          >
            {exportScheduleHistoryCsvMutation.isPending ? "내보내는 중" : "CSV export"}
          </Button>
        </div>
        {dashboardQuery.isPending ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">확정 스케줄을 불러오는 중입니다.</p>
          </div>
        ) : dashboardQuery.isError ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              확정 스케줄 정보를 불러오지 못했습니다.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : latestConfirmedSchedule ? (
          <ConfirmedScheduleCalendar
            startDate={latestConfirmedSchedule.startDate}
            endDate={latestConfirmedSchedule.endDate}
            schedules={latestConfirmedSchedules}
          />
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">확정된 스케줄이 없습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              스케줄을 확정하면 이곳에서 확인할 수 있습니다.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/schedules">스케줄로 이동</Link>
            </Button>
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
