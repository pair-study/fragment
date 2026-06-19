"use client";

import { useMemo, useState } from "react";
import { Badge, Button } from "@moyeorak/design-system";
import { Download } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ConfirmedSchedule = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  workerName: string;
};

type ScheduleHistory = {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  confirmedAt: string;
  scheduleCount: number;
  schedules: ConfirmedSchedule[];
};

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const WORKER_NAMES = [
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
const TIME_RANGES = [
  ["09:00", "13:00"],
  ["10:00", "14:00"],
  ["13:00", "17:00"],
  ["14:00", "18:00"],
  ["18:00", "22:00"],
];

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

function createConfirmedSchedules(startDate: string, endDate: string) {
  const dates = createDateRange(startDate, endDate);

  return WORKER_NAMES.map((workerName, index) => {
    const [startTime, endTime] = TIME_RANGES[index % TIME_RANGES.length];
    const date = index < 17 ? dates[6] : (dates[(index + 2) % dates.length] ?? endDate);

    return {
      id: `${startDate}-confirmed-${index + 1}`,
      date,
      startTime,
      endTime,
      workerName,
    };
  });
}

const SCHEDULE_HISTORIES: ScheduleHistory[] = [
  {
    id: "history-1",
    period: "2026-06-20 ~ 2026-07-05",
    startDate: "2026-06-20",
    endDate: "2026-07-05",
    confirmedAt: "2026-06-20",
    scheduleCount: 20,
    schedules: createConfirmedSchedules("2026-06-20", "2026-07-05"),
  },
  {
    id: "history-2",
    period: "2026-06-01 ~ 2026-06-15",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    confirmedAt: "2026-05-30",
    scheduleCount: 18,
    schedules: createConfirmedSchedules("2026-06-01", "2026-06-15").slice(0, 18),
  },
  {
    id: "history-3",
    period: "2026-05-16 ~ 2026-05-31",
    startDate: "2026-05-16",
    endDate: "2026-05-31",
    confirmedAt: "2026-05-14",
    scheduleCount: 16,
    schedules: createConfirmedSchedules("2026-05-16", "2026-05-31").slice(0, 16),
  },
  {
    id: "history-4",
    period: "2025-12-16 ~ 2025-12-31",
    startDate: "2025-12-16",
    endDate: "2025-12-31",
    confirmedAt: "2025-12-14",
    scheduleCount: 15,
    schedules: createConfirmedSchedules("2025-12-16", "2025-12-31").slice(0, 15),
  },
];

function getHistoryYear(history: ScheduleHistory) {
  return history.startDate.slice(0, 4);
}

function getHistoryMonth(history: ScheduleHistory) {
  return history.startDate.slice(5, 7);
}

export function MvpScheduleHistoryPage() {
  const [selectedHistoryId, setSelectedHistoryId] = useState(SCHEDULE_HISTORIES[0]?.id ?? "");
  const [selectedYear, setSelectedYear] = useState(getHistoryYear(SCHEDULE_HISTORIES[0]));
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [exportMessage, setExportMessage] = useState("");
  const historyYears = Array.from(new Set(SCHEDULE_HISTORIES.map(getHistoryYear)));
  const selectedYearHistories = SCHEDULE_HISTORIES.filter(
    (history) => getHistoryYear(history) === selectedYear,
  );
  const historyMonths = Array.from(new Set(selectedYearHistories.map(getHistoryMonth)));
  const filteredHistories = selectedYearHistories.filter(
    (history) => selectedMonth === "ALL" || getHistoryMonth(history) === selectedMonth,
  );
  const selectedHistory =
    filteredHistories.find((history) => history.id === selectedHistoryId) ??
    filteredHistories[0] ??
    selectedYearHistories[0] ??
    SCHEDULE_HISTORIES[0];
  const calendarDates = useMemo(
    () => createCalendarDates(selectedHistory.startDate, selectedHistory.endDate),
    [selectedHistory.endDate, selectedHistory.startDate],
  );

  return (
    <AdminPageShell
      title="보관함"
      description="확정된 스케줄을 기간별로 조회하고 CSV로 내보냅니다."
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">확정 이력</h2>
            <p className="mt-1 text-sm text-muted-foreground">확인할 근무 기간을 선택하세요.</p>
          </div>

          <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-2 xl:grid-cols-1">
            <Select
              value={selectedYear}
              onValueChange={(value) => {
                setSelectedYear(value);
                setSelectedMonth("ALL");
                setExportMessage("");
              }}
            >
              <SelectTrigger aria-label="이력 연도 선택">
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                {historyYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedMonth}
              onValueChange={(value) => {
                setSelectedMonth(value);
                setExportMessage("");
              }}
            >
              <SelectTrigger aria-label="이력 월 선택">
                <SelectValue placeholder="월 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 월</SelectItem>
                {historyMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {Number(month)}월
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-border">
            {filteredHistories.map((history) => {
              const selected = history.id === selectedHistory.id;

              return (
                <button
                  key={history.id}
                  type="button"
                  className={cn(
                    "block w-full px-5 py-4 text-left transition-colors",
                    selected ? "bg-accent" : "bg-card hover:bg-accent/60",
                  )}
                  onClick={() => {
                    setSelectedHistoryId(history.id);
                    setExportMessage("");
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{history.period}</p>
                    {selected ? <Badge variant="neutral-weak">선택됨</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">확정일 {history.confirmedAt}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {history.scheduleCount}개 배정
                  </p>
                </button>
              );
            })}
            {filteredHistories.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">
                선택한 기간에 확정된 스케줄 이력이 없습니다.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
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
                  <Badge variant="neutral-weak">CONFIRMED</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{selectedHistory.period}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  확정일 {selectedHistory.confirmedAt} · 총 {selectedHistory.scheduleCount}개 배정
                </p>
              </div>
              <Button
                type="button"
                variant="brand"
                onClick={() =>
                  setExportMessage(`${selectedHistory.period} CSV export가 준비되었습니다.`)
                }
              >
                <Download className="size-4" aria-hidden="true" />
                CSV export
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-7 border-l border-t border-border">
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
                  const dateSchedules = selectedHistory.schedules.filter(
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
                          <p
                            key={schedule.id}
                            className="truncate text-xs font-medium text-foreground"
                          >
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
        </div>
      </section>
    </AdminPageShell>
  );
}
