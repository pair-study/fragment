"use client";

import type { Availability, AvailabilityQuery, Worker } from "@fragment/shared";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@moyeorak/design-system";
import { Check } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { useAvailabilityQuery } from "@/features/availability/queries/availability-queries";
import { useActiveSchedulePlanningPeriodQuery } from "@/features/organization/queries/organization-queries";
import { useWorkersQuery } from "@/features/workers/queries/workers-queries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AvailabilitySlot = {
  workerId: string;
  date: string;
  startTime: string;
};

const ORGANIZATION_OPEN_TIME = "09:00";
const ORGANIZATION_CLOSE_TIME = "22:00";
const HOLIDAY_DATES = ["2026-06-21", "2026-06-28", "2026-07-05"];
const TIMETABLE_DATE_COLUMN_WIDTH = 76;
const EMPTY_WORKERS: Worker[] = [];

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Seoul",
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  weekday: "short",
  timeZone: "Asia/Seoul",
});

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(restMinutes).padStart(2, "0")}`;
}

function dateTimeToTime(dateTime: string) {
  const date = new Date(dateTime);
  return minutesToTime(date.getUTCHours() * 60 + date.getUTCMinutes());
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + days));
  return nextDate.toISOString().slice(0, 10);
}

function createDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate || endDate < startDate) {
    return [];
  }

  const dates: string[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

function createTimeSlots(openTime: string, closeTime: string) {
  const slots: string[] = [];

  for (let minutes = timeToMinutes(openTime); minutes < timeToMinutes(closeTime); minutes += 30) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

function formatDateLabel(date: string) {
  return DATE_FORMATTER.format(new Date(`${date}T00:00:00+09:00`)).replace(". ", ".");
}

function formatWeekday(date: string) {
  return WEEKDAY_FORMATTER.format(new Date(`${date}T00:00:00+09:00`));
}

function getSlotKey(workerId: string, date: string, startTime: string) {
  return `${workerId}:${date}:${startTime}`;
}

function availabilityToSlots(items: Availability[]) {
  return items.flatMap((item) => {
    const slots: AvailabilitySlot[] = [];
    const startMinutes = timeToMinutes(dateTimeToTime(item.startsAt));
    const endMinutes = timeToMinutes(dateTimeToTime(item.endsAt));

    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      slots.push({
        date: item.availableDate,
        startTime: minutesToTime(minutes),
        workerId: item.workerId,
      });
    }

    return slots;
  });
}

function hasSameSlots(firstSlots: AvailabilitySlot[], secondSlots: AvailabilitySlot[]) {
  const firstKeys = new Set(
    firstSlots.map((slot) => getSlotKey(slot.workerId, slot.date, slot.startTime)),
  );
  const secondKeys = new Set(
    secondSlots.map((slot) => getSlotKey(slot.workerId, slot.date, slot.startTime)),
  );

  if (firstKeys.size !== secondKeys.size) {
    return false;
  }

  return [...firstKeys].every((key) => secondKeys.has(key));
}

function summarizeAvailabilityByDate(slots: AvailabilitySlot[]) {
  const slotsByDate = slots.reduce<Record<string, string[]>>((acc, slot) => {
    acc[slot.date] = [...(acc[slot.date] ?? []), slot.startTime];
    return acc;
  }, {});

  return Object.entries(slotsByDate)
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, startTimes]) => {
      const sortedMinutes = [...new Set(startTimes.map(timeToMinutes))].sort((a, b) => a - b);
      const ranges: { startTime: string; endTime: string }[] = [];

      let rangeStart = sortedMinutes[0];
      let previous = sortedMinutes[0];

      for (const current of sortedMinutes.slice(1)) {
        if (current === previous + 30) {
          previous = current;
          continue;
        }

        ranges.push({
          startTime: minutesToTime(rangeStart),
          endTime: minutesToTime(previous + 30),
        });
        rangeStart = current;
        previous = current;
      }

      if (rangeStart !== undefined && previous !== undefined) {
        ranges.push({
          startTime: minutesToTime(rangeStart),
          endTime: minutesToTime(previous + 30),
        });
      }

      return {
        date,
        ranges,
      };
    });
}

export function MvpAvailabilityPage() {
  const workersQuery = useWorkersQuery();
  const planningPeriodQuery = useActiveSchedulePlanningPeriodQuery();
  const workers = workersQuery.data?.items ?? EMPTY_WORKERS;
  const activePlanningPeriod = planningPeriodQuery.data?.period ?? null;
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState("");
  const [workStartDate, setWorkStartDate] = useState("");
  const [workEndDate, setWorkEndDate] = useState("");
  const [savedAvailability, setSavedAvailability] = useState<AvailabilitySlot[]>([]);
  const [draftAvailability, setDraftAvailability] = useState<AvailabilitySlot[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const availabilityQuery: AvailabilityQuery = useMemo(
    () => ({
      endDate: workEndDate,
      startDate: workStartDate,
      workerId: selectedWorkerId,
    }),
    [selectedWorkerId, workEndDate, workStartDate],
  );
  const canFetchAvailability =
    Boolean(selectedWorkerId && workStartDate && workEndDate) && workStartDate <= workEndDate;
  const availabilityResult = useAvailabilityQuery(availabilityQuery, canFetchAvailability);
  const dateRange = useMemo(
    () => createDateRange(workStartDate, workEndDate),
    [workEndDate, workStartDate],
  );
  const timeSlots = useMemo(
    () => createTimeSlots(ORGANIZATION_OPEN_TIME, ORGANIZATION_CLOSE_TIME),
    [],
  );

  useEffect(() => {
    if (!activePlanningPeriod) {
      return;
    }

    setWorkStartDate(activePlanningPeriod.startDate);
    setWorkEndDate(activePlanningPeriod.endDate);
  }, [activePlanningPeriod]);

  useEffect(() => {
    if (workers.length === 0) {
      setSelectedWorkerId("");
      return;
    }

    if (!workers.some((worker) => worker.id === selectedWorkerId)) {
      setSelectedWorkerId(workers[0].id);
      setSelectedAvailabilityDate("");
      setSaveMessage("");
    }
  }, [selectedWorkerId, workers]);

  useEffect(() => {
    const slots = availabilityToSlots(availabilityResult.data?.items ?? []);

    setSavedAvailability(slots);
    setDraftAvailability(slots);
    setSelectedAvailabilityDate("");
    setSaveMessage("");
  }, [availabilityResult.data]);

  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId);
  const selectedDraftAvailability = draftAvailability.filter(
    (slot) =>
      slot.workerId === selectedWorkerId && slot.date >= workStartDate && slot.date <= workEndDate,
  );
  const selectedAvailabilityByDate = summarizeAvailabilityByDate(selectedDraftAvailability);
  const activeAvailabilityDate =
    selectedAvailabilityByDate.find((group) => group.date === selectedAvailabilityDate)?.date ??
    selectedAvailabilityByDate[0]?.date ??
    "";
  const activeAvailabilityRanges =
    selectedAvailabilityByDate.find((group) => group.date === activeAvailabilityDate)?.ranges ?? [];
  const selectedAvailabilityRangeCount = selectedAvailabilityByDate.reduce(
    (total, group) => total + group.ranges.length,
    0,
  );
  const draftSlotKeys = new Set(
    selectedDraftAvailability.map((slot) => getSlotKey(slot.workerId, slot.date, slot.startTime)),
  );
  const hasUnsavedChanges = !hasSameSlots(savedAvailability, draftAvailability);

  function toggleSlot(date: string, startTime: string) {
    if (!selectedWorkerId) {
      return;
    }

    if (HOLIDAY_DATES.includes(date)) {
      return;
    }

    const key = getSlotKey(selectedWorkerId, date, startTime);
    const selected = draftSlotKeys.has(key);

    setDraftAvailability((currentAvailability) =>
      selected
        ? currentAvailability.filter(
            (slot) => getSlotKey(slot.workerId, slot.date, slot.startTime) !== key,
          )
        : [
            ...currentAvailability,
            {
              workerId: selectedWorkerId,
              date,
              startTime,
            },
          ],
    );
    setSaveMessage("");
  }

  function saveAvailability() {
    setSavedAvailability(draftAvailability);
    setSaveMessage("가능 시간이 저장되었습니다.");
  }

  return (
    <AdminPageShell
      title="가능 시간 관리"
      description="근무 기간을 정하고, 근무자별로 일할 수 있는 날짜와 시간대를 30분 단위로 선택한 뒤 저장합니다."
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!hasUnsavedChanges}
            onClick={() => {
              setDraftAvailability(savedAvailability);
              setSaveMessage("");
            }}
          >
            변경 취소
          </Button>
          <Button
            type="button"
            variant="brand"
            disabled={!hasUnsavedChanges}
            onClick={saveAvailability}
          >
            변경사항 저장
          </Button>
        </div>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">근무 기간 설정</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              모든 근무자의 가능 시간 입력에 공통으로 적용되는 기간입니다.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:w-[480px]">
            <div className="space-y-2">
              <Label htmlFor="availability-work-start-date">근무 시작 날짜</Label>
              <Input
                id="availability-work-start-date"
                type="date"
                value={workStartDate}
                onChange={(event) => {
                  setWorkStartDate(event.target.value);
                  setSelectedAvailabilityDate("");
                  setSaveMessage("");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability-work-end-date">근무 종료 날짜</Label>
              <Input
                id="availability-work-end-date"
                type="date"
                value={workEndDate}
                onChange={(event) => {
                  setWorkEndDate(event.target.value);
                  setSelectedAvailabilityDate("");
                  setSaveMessage("");
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="grid gap-5 lg:grid-cols-[minmax(240px,320px)_1fr] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="worker-select">근무자 선택</Label>
            <Select
              value={selectedWorkerId}
              disabled={workers.length === 0}
              onValueChange={(value) => {
                setSelectedWorkerId(value);
                setSelectedAvailabilityDate("");
                setSaveMessage("");
              }}
            >
              <SelectTrigger id="worker-select">
                <SelectValue placeholder="근무자를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-surface-secondary px-4 py-3">
            {selectedWorker ? (
              <>
                <p className="text-sm font-semibold text-foreground">{selectedWorker.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  주간 계약 시간: 주 {selectedWorker.weeklyContractHours}시간 · 운영 시간:{" "}
                  {ORGANIZATION_OPEN_TIME}-{ORGANIZATION_CLOSE_TIME}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">등록된 근무자가 없습니다.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">선택된 가능 시간</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              날짜를 선택하면 해당 날짜의 가능 시간이 표시됩니다.
            </p>
          </div>
          <Badge variant="neutral-weak">{selectedAvailabilityRangeCount}개 구간</Badge>
        </div>

        {selectedAvailabilityByDate.length > 0 ? (
          <>
            <div className="mt-4 max-w-full overflow-x-auto pb-1">
              <div className="flex w-max min-w-max gap-2">
                {selectedAvailabilityByDate.map((group) => {
                  const active = group.date === activeAvailabilityDate;

                  return (
                    <button
                      key={group.date}
                      type="button"
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface-secondary text-foreground hover:border-primary hover:bg-accent",
                      )}
                      onClick={() => setSelectedAvailabilityDate(group.date)}
                    >
                      {formatDateLabel(group.date)}({formatWeekday(group.date)}) ·{" "}
                      {group.ranges.length}개
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-surface-secondary px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {formatDateLabel(activeAvailabilityDate)}({formatWeekday(activeAvailabilityDate)})
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeAvailabilityRanges.map((range) => (
                  <span
                    key={`${activeAvailabilityDate}-${range.startTime}`}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    {range.startTime}~{range.endTime}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">선택된 가능 시간이 없습니다.</p>
        )}
      </section>

      {saveMessage ? (
        <div className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted-foreground">
          {saveMessage}
        </div>
      ) : null}

      <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">가능 시간 타임테이블</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                셀을 선택한 뒤 상단의 변경사항 저장 버튼을 눌러 등록합니다. 선택된 셀을 다시 누르면
                삭제됩니다.
              </p>
            </div>
            {hasUnsavedChanges ? <Badge variant="brand-weak">저장 전 변경 있음</Badge> : null}
          </div>
        </div>

        <div className="max-w-full overflow-x-auto overflow-y-hidden p-4">
          <div className="w-max min-w-max">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `56px repeat(${dateRange.length}, ${TIMETABLE_DATE_COLUMN_WIDTH}px)`,
              }}
            >
              <div />
              {dateRange.map((date) => (
                <div key={date} className="py-2 text-center">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {formatWeekday(date)}
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">{formatDateLabel(date)}</p>
                  {HOLIDAY_DATES.includes(date) ? (
                    <Badge variant="neutral-weak" size="sm" className="mt-2">
                      휴무
                    </Badge>
                  ) : null}
                </div>
              ))}

              {timeSlots.map((time) => {
                const showHourLabel = time.endsWith(":00");

                return (
                  <div key={time} className="contents">
                    <div className="h-8 pr-2 text-right text-sm text-muted-foreground">
                      {showHourLabel ? Number(time.slice(0, 2)) : ""}
                    </div>
                    {dateRange.map((date) => {
                      const disabled = HOLIDAY_DATES.includes(date);
                      const selected = draftSlotKeys.has(getSlotKey(selectedWorkerId, date, time));

                      return (
                        <button
                          key={`${date}-${time}`}
                          type="button"
                          disabled={disabled}
                          aria-pressed={selected}
                          aria-label={`${date} ${time} 가능 시간 ${selected ? "해제" : "선택"}`}
                          className={cn(
                            "flex h-8 items-center justify-center rounded-md border text-[10px] transition-colors",
                            disabled
                              ? "cursor-not-allowed border-border bg-muted/60 text-muted-foreground opacity-60"
                              : selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-surface-secondary hover:border-primary hover:bg-accent",
                          )}
                          onClick={() => toggleSlot(date, time)}
                        >
                          {selected ? <Check className="size-3" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}
