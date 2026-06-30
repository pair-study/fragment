"use client";

import { useState } from "react";
import { Button } from "@moyeorak/design-system";
import { Download } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { ConfirmedScheduleCalendar } from "@/features/schedules/components/confirmed-schedule-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  schedules: ConfirmedSchedule[];
};

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
    schedules: createConfirmedSchedules("2026-06-20", "2026-07-05"),
  },
  {
    id: "history-2",
    period: "2026-06-01 ~ 2026-06-15",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    confirmedAt: "2026-05-30",
    schedules: createConfirmedSchedules("2026-06-01", "2026-06-15").slice(0, 18),
  },
  {
    id: "history-3",
    period: "2026-05-16 ~ 2026-05-31",
    startDate: "2026-05-16",
    endDate: "2026-05-31",
    confirmedAt: "2026-05-14",
    schedules: createConfirmedSchedules("2026-05-16", "2026-05-31").slice(0, 16),
  },
  {
    id: "history-4",
    period: "2025-12-16 ~ 2025-12-31",
    startDate: "2025-12-16",
    endDate: "2025-12-31",
    confirmedAt: "2025-12-14",
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
                <h2 className="text-base font-semibold text-foreground">확정 스케줄 기록</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                확정일 {selectedHistory.confirmedAt}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[7rem_7rem_15rem_auto]">
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
                  <SelectItem value="ALL">전체</SelectItem>
                  {historyMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {Number(month)}월
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedHistory.id}
                onValueChange={(value) => {
                  setSelectedHistoryId(value);
                  setExportMessage("");
                }}
              >
                <SelectTrigger aria-label="확정 이력 선택">
                  <SelectValue placeholder="확정 이력 선택" />
                </SelectTrigger>
                <SelectContent>
                  {filteredHistories.map((history) => (
                    <SelectItem key={history.id} value={history.id}>
                      {history.period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
          </div>
          <ConfirmedScheduleCalendar
            key={selectedHistory.id}
            startDate={selectedHistory.startDate}
            endDate={selectedHistory.endDate}
            schedules={selectedHistory.schedules}
          />
        </section>
      </section>
    </AdminPageShell>
  );
}
