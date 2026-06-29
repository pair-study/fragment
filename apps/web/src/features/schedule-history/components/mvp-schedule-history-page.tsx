"use client";

import { useMemo, useState } from "react";
import type { ScheduleAssignment, ScheduleHistoryItem } from "@fragment/shared";
import { Button } from "@moyeorak/design-system";
import { Download } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useExportScheduleHistoryCsvMutation,
  useScheduleHistoryDetailQuery,
  useScheduleHistoryQuery,
  useScheduleHistoryYearQueries,
} from "@/features/schedule-history/queries/schedule-history-queries";
import { getApiErrorMessage } from "@/lib/api-error-message";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const INITIAL_HISTORY_YEAR = new Date().getFullYear();
const HISTORY_YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => INITIAL_HISTORY_YEAR - index);

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

function formatScheduleRange(startDate: string, endDate: string) {
  return `${startDate} ~ ${endDate}`;
}

function formatConfirmedAt(confirmedAt: string) {
  return confirmedAt.slice(0, 10);
}

function formatDateTimeToTime(dateTime: string) {
  return dateTime.slice(11, 16);
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

function findSelectedHistory(items: ScheduleHistoryItem[], selectedHistoryId: string) {
  return items.find((history) => history.id === selectedHistoryId) ?? items[0] ?? null;
}

function getMonthRange(year: string, month: string) {
  const monthNumber = Number(month);
  const monthStart = `${year}-${month.padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(Number(year), monthNumber, 0)).toISOString().slice(0, 10);

  return { monthEnd, monthStart };
}

function isHistoryInMonth(history: ScheduleHistoryItem, year: string, month: string) {
  const { monthEnd, monthStart } = getMonthRange(year, month);

  return history.startDate <= monthEnd && history.endDate >= monthStart;
}

function getHistoryMonthOptions(items: ScheduleHistoryItem[], year: string) {
  return Array.from({ length: 12 }, (_, index) => String(index + 1)).filter((month) =>
    items.some((history) => isHistoryInMonth(history, year, month)),
  );
}

export function MvpScheduleHistoryPage() {
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(INITIAL_HISTORY_YEAR));
  const [selectedMonth, setSelectedMonth] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const scheduleHistoryYearQueries = useScheduleHistoryYearQueries(HISTORY_YEAR_OPTIONS);
  const historyYearItems = scheduleHistoryYearQueries.map((query, index) => ({
    items: query.data?.items ?? [],
    year: String(HISTORY_YEAR_OPTIONS[index]),
  }));
  const availableYears = historyYearItems
    .filter((historyYearItem) => historyYearItem.items.length > 0)
    .map((historyYearItem) => historyYearItem.year);
  const hasAvailableYears = availableYears.length > 0;
  const effectiveSelectedYear = availableYears.includes(selectedYear)
    ? selectedYear
    : (availableYears[0] ?? selectedYear);
  const selectedYearItems =
    historyYearItems.find((historyYearItem) => historyYearItem.year === effectiveSelectedYear)
      ?.items ?? [];
  const availableMonths = getHistoryMonthOptions(selectedYearItems, effectiveSelectedYear);
  const effectiveSelectedMonth = availableMonths.includes(selectedMonth)
    ? selectedMonth
    : (availableMonths[0] ?? "");
  const scheduleHistoryQuery = useScheduleHistoryQuery({
    year: Number(effectiveSelectedYear),
    ...(effectiveSelectedMonth === "" ? {} : { month: Number(effectiveSelectedMonth) }),
  });
  const historyItems = scheduleHistoryQuery.data?.items ?? [];
  const hasHistoryItems = historyItems.length > 0;
  const selectedHistoryItem = findSelectedHistory(historyItems, selectedHistoryId);
  const selectedScheduleId = selectedHistoryItem?.id ?? "";
  const scheduleHistoryDetailQuery = useScheduleHistoryDetailQuery(
    selectedScheduleId,
    selectedScheduleId !== "",
  );
  const exportScheduleHistoryCsvMutation = useExportScheduleHistoryCsvMutation();
  const selectedHistory = scheduleHistoryDetailQuery.data ?? null;
  const calendarDates = useMemo(
    () =>
      selectedHistory
        ? createCalendarDates(selectedHistory.startDate, selectedHistory.endDate)
        : [],
    [selectedHistory],
  );
  const canExportSchedule = selectedHistory !== null && !exportScheduleHistoryCsvMutation.isPending;

  const handleExportSchedule = async () => {
    if (!selectedHistory) {
      return;
    }

    setExportMessage("");

    try {
      const blob = await exportScheduleHistoryCsvMutation.mutateAsync(selectedHistory.id);

      downloadBlob(blob, createCsvFileName(selectedHistory.startDate, selectedHistory.endDate));
      setExportMessage("CSV 파일을 다운로드했습니다.");
    } catch (error) {
      setExportMessage(getApiErrorMessage(error, "CSV 다운로드에 실패했습니다."));
    }
  };

  return (
    <AdminPageShell
      title="보관함"
      description="확정된 스케줄을 기간별로 조회하고 CSV로 내보냅니다."
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="space-y-6">
        {exportMessage ? (
          <div className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted-foreground">
            {exportMessage}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-col gap-4 border-b border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">읽기 모드 달력</h2>
              </div>
              {scheduleHistoryQuery.isPending ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  확정 스케줄 보관함을 불러오는 중입니다.
                </p>
              ) : scheduleHistoryQuery.isError || scheduleHistoryDetailQuery.isError ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  확정 스케줄 보관함을 불러오지 못했습니다.
                </p>
              ) : selectedHistory ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  확정일 {formatConfirmedAt(selectedHistory.confirmedAt)} · 총{" "}
                  {selectedHistory.assignments.length}개 배정
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  선택한 조건에 해당하는 확정 스케줄이 없습니다.
                </p>
              )}
            </div>
            {hasAvailableYears ? (
              <div className="grid gap-2 sm:grid-cols-[7rem_7rem_15rem_auto]">
                <Select
                  value={effectiveSelectedYear}
                  onValueChange={(value) => {
                    setSelectedYear(value);
                    setSelectedMonth("");
                    setSelectedHistoryId("");
                    setExportMessage("");
                  }}
                >
                  <SelectTrigger aria-label="이력 연도 선택">
                    <SelectValue placeholder="연도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={effectiveSelectedMonth}
                  onValueChange={(value) => {
                    setSelectedMonth(value);
                    setSelectedHistoryId("");
                    setExportMessage("");
                  }}
                >
                  <SelectTrigger aria-label="이력 월 선택">
                    <SelectValue placeholder="월 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((month) => (
                      <SelectItem key={month} value={String(month)}>
                        {month}월
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasHistoryItems ? (
                  <>
                    <Select
                      value={selectedHistoryItem?.id ?? ""}
                      onValueChange={(value) => {
                        setSelectedHistoryId(value);
                        setExportMessage("");
                      }}
                    >
                      <SelectTrigger aria-label="확정 이력 선택">
                        <SelectValue placeholder="확정 이력 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {historyItems.map((history) => (
                          <SelectItem key={history.id} value={history.id}>
                            {formatScheduleRange(history.startDate, history.endDate)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="brand"
                      onClick={handleExportSchedule}
                      disabled={!canExportSchedule}
                    >
                      <Download className="size-4" aria-hidden="true" />
                      {exportScheduleHistoryCsvMutation.isPending ? "내보내는 중" : "CSV export"}
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          {scheduleHistoryQuery.isPending || scheduleHistoryDetailQuery.isPending ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                확정 스케줄을 불러오는 중입니다.
              </p>
            </div>
          ) : scheduleHistoryQuery.isError || scheduleHistoryDetailQuery.isError ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                확정 스케줄 보관함을 불러오지 못했습니다.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
            </div>
          ) : selectedHistory ? (
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
                  const inRange =
                    date >= selectedHistory.startDate && date <= selectedHistory.endDate;
                  const dateSchedules = selectedHistory.assignments.filter(
                    (assignment) => assignment.workDate === date,
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
                        {dateSchedules.map((assignment: ScheduleAssignment) => (
                          <p
                            key={assignment.id}
                            className="truncate text-xs font-medium text-foreground"
                          >
                            {formatDateTimeToTime(assignment.startsAt)}-
                            {formatDateTimeToTime(assignment.endsAt)}{" "}
                            {assignment.workerNameSnapshot}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">확정된 스케줄이 없습니다.</p>
              <p className="mt-2 text-sm text-muted-foreground">다른 연도나 월을 선택해 주세요.</p>
            </div>
          )}
        </section>
      </section>
    </AdminPageShell>
  );
}
