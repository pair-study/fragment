"use client";

import { useMemo, useState } from "react";
import { Badge, Button } from "@moyeorak/design-system";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Worker = {
  id: string;
  name: string;
  weeklyContractHours: number;
};

type AvailabilitySlot = {
  workerId: string;
  date: string;
  startTime: string;
};

const WORKERS: Worker[] = [
  { id: "worker-1", name: "김민지", weeklyContractHours: 15 },
  { id: "worker-2", name: "박준호", weeklyContractHours: 20 },
  { id: "worker-3", name: "이서연", weeklyContractHours: 12 },
];

const WORK_START_DATE = "2026-06-22";
const WORK_END_DATE = "2026-06-28";
const ORGANIZATION_OPEN_TIME = "09:00";
const ORGANIZATION_CLOSE_TIME = "22:00";
const HOLIDAY_DATES = ["2026-06-28"];

const INITIAL_AVAILABILITY: AvailabilitySlot[] = [
  { workerId: "worker-1", date: "2026-06-22", startTime: "18:00" },
  { workerId: "worker-1", date: "2026-06-22", startTime: "18:30" },
  { workerId: "worker-1", date: "2026-06-22", startTime: "19:00" },
  { workerId: "worker-1", date: "2026-06-24", startTime: "18:00" },
  { workerId: "worker-1", date: "2026-06-24", startTime: "18:30" },
  { workerId: "worker-2", date: "2026-06-26", startTime: "14:00" },
  { workerId: "worker-2", date: "2026-06-26", startTime: "14:30" },
  { workerId: "worker-2", date: "2026-06-26", startTime: "15:00" },
];

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

function addDays(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00+09:00`);
  nextDate.setDate(nextDate.getDate() + days);
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

export function MvpAvailabilityPage() {
  const [selectedWorkerId, setSelectedWorkerId] = useState(WORKERS[0]?.id ?? "");
  const [savedAvailability, setSavedAvailability] =
    useState<AvailabilitySlot[]>(INITIAL_AVAILABILITY);
  const [draftAvailability, setDraftAvailability] =
    useState<AvailabilitySlot[]>(INITIAL_AVAILABILITY);
  const [saveMessage, setSaveMessage] = useState("");
  const dateRange = useMemo(() => createDateRange(WORK_START_DATE, WORK_END_DATE), []);
  const timeSlots = useMemo(
    () => createTimeSlots(ORGANIZATION_OPEN_TIME, ORGANIZATION_CLOSE_TIME),
    [],
  );

  const selectedWorker = WORKERS.find((worker) => worker.id === selectedWorkerId) ?? WORKERS[0];
  const selectedDraftAvailability = draftAvailability.filter(
    (slot) => slot.workerId === selectedWorkerId,
  );
  const draftSlotKeys = new Set(
    selectedDraftAvailability.map((slot) => getSlotKey(slot.workerId, slot.date, slot.startTime)),
  );
  const hasUnsavedChanges = !hasSameSlots(savedAvailability, draftAvailability);

  function toggleSlot(date: string, startTime: string) {
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
      description="근무자별로 일할 수 있는 날짜와 시간대를 30분 단위로 선택한 뒤 저장합니다."
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
        <div className="grid gap-5 lg:grid-cols-[minmax(240px,360px)_1fr] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="worker-select">근무자 선택</Label>
            <Select
              value={selectedWorkerId}
              onValueChange={(value) => {
                setSelectedWorkerId(value);
                setSaveMessage("");
              }}
            >
              <SelectTrigger id="worker-select">
                <SelectValue placeholder="근무자를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {WORKERS.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-surface-secondary px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{selectedWorker.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              주간 계약 시간: 주 {selectedWorker.weeklyContractHours}시간 · 근무 기간:{" "}
              {WORK_START_DATE}~{WORK_END_DATE} · 운영 시간: {ORGANIZATION_OPEN_TIME}-
              {ORGANIZATION_CLOSE_TIME}
            </p>
          </div>
        </div>
      </section>

      {saveMessage ? (
        <div className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted-foreground">
          {saveMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
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

        <div className="overflow-auto p-4">
          <div className="w-full min-w-[520px]">
            <div className="grid grid-cols-[56px_repeat(7,minmax(48px,1fr))] gap-1">
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
                    <div className="h-9 pr-2 text-right text-sm text-muted-foreground">
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
                          aria-label={`${date} ${time} 가능 시간 ${selected ? "해제" : "선택"}`}
                          className={cn(
                            "h-9 rounded-md border text-xs transition-colors",
                            disabled
                              ? "cursor-not-allowed border-border bg-muted/60 text-muted-foreground opacity-60"
                              : selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-surface-secondary hover:border-primary hover:bg-accent",
                          )}
                          onClick={() => toggleSlot(date, time)}
                        >
                          {selected ? "가능" : ""}
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
