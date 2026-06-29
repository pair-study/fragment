"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmedScheduleCalendarItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  workerName: string;
};

type ConfirmedScheduleCalendarProps = {
  endDate: string;
  schedules: ConfirmedScheduleCalendarItem[];
  startDate: string;
};

type ScheduleTimeGroup = {
  endTime: string;
  id: string;
  startTime: string;
  workerNames: string[];
};

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const MAX_VISIBLE_GROUPS = 3;
const MAX_VISIBLE_WORKER_NAMES = 2;

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

function formatDateTitle(date: string) {
  const [, month, day] = date.split("-");

  return `${Number(month)}월 ${Number(day)}일`;
}

function getTimeRangeLabel(group: ScheduleTimeGroup) {
  return `${group.startTime}-${group.endTime}`;
}

function getWorkerNamesPreview(workerNames: string[]) {
  const visibleWorkerNames = workerNames.slice(0, MAX_VISIBLE_WORKER_NAMES);
  const hiddenWorkerCount = workerNames.length - visibleWorkerNames.length;
  const visibleLabel = visibleWorkerNames.join(", ");

  if (hiddenWorkerCount <= 0) {
    return visibleLabel;
  }

  return `${visibleLabel} 외 ${hiddenWorkerCount}명`;
}

function groupSchedulesByTime(schedules: ConfirmedScheduleCalendarItem[]) {
  const groupsByTime = new Map<string, ScheduleTimeGroup>();

  schedules.forEach((schedule) => {
    const key = `${schedule.startTime}-${schedule.endTime}`;
    const group = groupsByTime.get(key);

    if (group) {
      group.workerNames.push(schedule.workerName);
      return;
    }

    groupsByTime.set(key, {
      endTime: schedule.endTime,
      id: key,
      startTime: schedule.startTime,
      workerNames: [schedule.workerName],
    });
  });

  return [...groupsByTime.values()].sort((left, right) => {
    const startCompare = left.startTime.localeCompare(right.startTime);

    if (startCompare !== 0) {
      return startCompare;
    }

    return left.endTime.localeCompare(right.endTime);
  });
}

export function ConfirmedScheduleCalendar({
  endDate,
  schedules,
  startDate,
}: ConfirmedScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendarDates = useMemo(
    () => createCalendarDates(startDate, endDate),
    [endDate, startDate],
  );
  const schedulesByDate = useMemo(() => {
    const nextSchedulesByDate = new Map<string, ConfirmedScheduleCalendarItem[]>();

    schedules.forEach((schedule) => {
      const dateSchedules = nextSchedulesByDate.get(schedule.date) ?? [];
      nextSchedulesByDate.set(schedule.date, [...dateSchedules, schedule]);
    });

    return nextSchedulesByDate;
  }, [schedules]);
  const selectedDateSchedules = selectedDate ? (schedulesByDate.get(selectedDate) ?? []) : [];
  const selectedDateGroups = groupSchedulesByTime(selectedDateSchedules);

  return (
    <>
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
            const inRange = date >= startDate && date <= endDate;
            const dateSchedules = schedulesByDate.get(date) ?? [];
            const timeGroups = groupSchedulesByTime(dateSchedules);
            const visibleGroups = timeGroups.slice(0, MAX_VISIBLE_GROUPS);
            const hiddenGroupCount = timeGroups.length - visibleGroups.length;
            const canOpenDetail = inRange && dateSchedules.length > 0;
            const Cell = canOpenDetail ? "button" : "div";

            return (
              <Cell
                key={date}
                type={canOpenDetail ? "button" : undefined}
                aria-label={
                  canOpenDetail ? `${formatDateTitle(date)} 확정 스케줄 상세 보기` : undefined
                }
                onClick={canOpenDetail ? () => setSelectedDate(date) : undefined}
                className={
                  inRange
                    ? [
                        "flex min-h-36 w-full flex-col items-stretch border-b border-r border-border bg-card p-3 text-left",
                        canOpenDetail
                          ? "cursor-pointer transition-colors hover:bg-accent/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                          : "",
                      ].join(" ")
                    : "flex min-h-36 w-full flex-col items-stretch border-b border-r border-border bg-surface-secondary p-3 text-left opacity-45"
                }
              >
                <div className="shrink-0">
                  <p className="text-sm font-bold text-foreground">{date.slice(8, 10)}</p>
                </div>

                <div className="mt-3 space-y-1.5">
                  {visibleGroups.map((group) => (
                    <div
                      key={group.id}
                      className="block w-full rounded-md bg-surface-secondary px-2 py-1.5 text-left"
                    >
                      <span className="block truncate text-xs font-semibold text-foreground">
                        {getTimeRangeLabel(group)}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] leading-4 text-muted-foreground">
                        {getWorkerNamesPreview(group.workerNames)}
                      </span>
                    </div>
                  ))}

                  {hiddenGroupCount > 0 ? (
                    <p className="text-xs font-semibold text-primary">+ 더보기</p>
                  ) : null}
                </div>
              </Cell>
            );
          })}
        </div>
      </div>

      <Dialog open={Boolean(selectedDate)} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-xl">
          <div className="flex items-start justify-between gap-4">
            <DialogHeader>
              <DialogTitle>
                {selectedDate ? `${formatDateTitle(selectedDate)} 확정 스케줄` : "확정 스케줄"}
              </DialogTitle>
            </DialogHeader>
            <DialogClose className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <span className="sr-only">닫기</span>
              <X className="size-5" aria-hidden="true" />
            </DialogClose>
          </div>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {selectedDateGroups.map((group) => (
              <div key={group.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {getTimeRangeLabel(group)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.workerNames.map((workerName, index) => (
                    <span
                      key={`${group.id}-${workerName}-${index}`}
                      className="rounded-md bg-surface-secondary px-2.5 py-1 text-sm font-medium text-foreground"
                    >
                      {workerName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
