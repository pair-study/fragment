"use client";

import { useMemo, useState } from "react";
import { Badge } from "@moyeorak/design-system";

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

type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

type AvailabilitySlot = {
  workerId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
};

const WORKERS: Worker[] = [
  { id: "worker-1", name: "김민지", weeklyContractHours: 15 },
  { id: "worker-2", name: "박준호", weeklyContractHours: 20 },
  { id: "worker-3", name: "이서연", weeklyContractHours: 12 },
];

const DAYS: Array<{ value: DayOfWeek; shortLabel: string; label: string }> = [
  { value: "MON", shortLabel: "월", label: "월요일" },
  { value: "TUE", shortLabel: "화", label: "화요일" },
  { value: "WED", shortLabel: "수", label: "수요일" },
  { value: "THU", shortLabel: "목", label: "목요일" },
  { value: "FRI", shortLabel: "금", label: "금요일" },
  { value: "SAT", shortLabel: "토", label: "토요일" },
  { value: "SUN", shortLabel: "일", label: "일요일" },
];

const ORGANIZATION_OPEN_TIME = "09:00";
const ORGANIZATION_CLOSE_TIME = "22:00";
const HOLIDAY_DAYS: DayOfWeek[] = ["SUN"];

const INITIAL_AVAILABILITY: AvailabilitySlot[] = [
  { workerId: "worker-1", dayOfWeek: "MON", startTime: "18:00" },
  { workerId: "worker-1", dayOfWeek: "MON", startTime: "18:30" },
  { workerId: "worker-1", dayOfWeek: "MON", startTime: "19:00" },
  { workerId: "worker-1", dayOfWeek: "MON", startTime: "19:30" },
  { workerId: "worker-1", dayOfWeek: "WED", startTime: "18:00" },
  { workerId: "worker-1", dayOfWeek: "WED", startTime: "18:30" },
  { workerId: "worker-1", dayOfWeek: "WED", startTime: "19:00" },
  { workerId: "worker-2", dayOfWeek: "FRI", startTime: "14:00" },
  { workerId: "worker-2", dayOfWeek: "FRI", startTime: "14:30" },
  { workerId: "worker-2", dayOfWeek: "FRI", startTime: "15:00" },
];

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(restMinutes).padStart(2, "0")}`;
}

function createTimeSlots(openTime: string, closeTime: string) {
  const slots: string[] = [];

  for (let minutes = timeToMinutes(openTime); minutes < timeToMinutes(closeTime); minutes += 30) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

function getSlotKey(workerId: string, dayOfWeek: DayOfWeek, startTime: string) {
  return `${workerId}:${dayOfWeek}:${startTime}`;
}

export function MvpAvailabilityPage() {
  const [selectedWorkerId, setSelectedWorkerId] = useState(WORKERS[0]?.id ?? "");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(INITIAL_AVAILABILITY);
  const timeSlots = useMemo(
    () => createTimeSlots(ORGANIZATION_OPEN_TIME, ORGANIZATION_CLOSE_TIME),
    [],
  );

  const selectedWorker = WORKERS.find((worker) => worker.id === selectedWorkerId) ?? WORKERS[0];
  const selectedAvailability = availability.filter((slot) => slot.workerId === selectedWorkerId);
  const selectedSlotKeys = new Set(
    selectedAvailability.map((slot) => getSlotKey(slot.workerId, slot.dayOfWeek, slot.startTime)),
  );

  function toggleSlot(dayOfWeek: DayOfWeek, startTime: string) {
    if (HOLIDAY_DAYS.includes(dayOfWeek)) {
      return;
    }

    const key = getSlotKey(selectedWorkerId, dayOfWeek, startTime);
    const selected = selectedSlotKeys.has(key);

    setAvailability((currentAvailability) =>
      selected
        ? currentAvailability.filter(
            (slot) => getSlotKey(slot.workerId, slot.dayOfWeek, slot.startTime) !== key,
          )
        : [
            ...currentAvailability,
            {
              workerId: selectedWorkerId,
              dayOfWeek,
              startTime,
            },
          ],
    );
  }

  return (
    <AdminPageShell
      title="가능 시간 관리"
      description="근무자별로 일할 수 있는 요일과 시간대를 30분 단위로 등록합니다."
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="grid gap-5 lg:grid-cols-[minmax(240px,360px)_1fr] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="worker-select">근무자 선택</Label>
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
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
              주간 계약 시간: 주 {selectedWorker.weeklyContractHours}시간 · 매장 운영 시간:{" "}
              {ORGANIZATION_OPEN_TIME}-{ORGANIZATION_CLOSE_TIME}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">가능 시간 타임테이블</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              셀을 클릭하면 가능 시간이 추가되고, 다시 클릭하면 해제됩니다.
            </p>
          </div>

          <div className="overflow-auto p-4">
            <div className="min-w-4xl">
              <div className="grid grid-cols-[56px_repeat(7,minmax(96px,1fr))] gap-1">
                <div />
                {DAYS.map((day) => (
                  <div key={day.value} className="py-2 text-center">
                    <p className="text-xs font-semibold text-muted-foreground">{day.shortLabel}</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{day.label}</p>
                    {HOLIDAY_DAYS.includes(day.value) ? (
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
                      <div className="h-10 pr-2 text-right text-sm text-muted-foreground">
                        {showHourLabel ? Number(time.slice(0, 2)) : ""}
                      </div>
                      {DAYS.map((day) => {
                        const disabled = HOLIDAY_DAYS.includes(day.value);
                        const selected = selectedSlotKeys.has(
                          getSlotKey(selectedWorkerId, day.value, time),
                        );

                        return (
                          <button
                            key={`${day.value}-${time}`}
                            type="button"
                            disabled={disabled}
                            aria-label={`${day.label} ${time} 가능 시간 ${
                              selected ? "해제" : "선택"
                            }`}
                            className={cn(
                              "h-10 rounded-md border text-xs transition-colors",
                              disabled
                                ? "cursor-not-allowed border-border bg-muted/60 text-muted-foreground opacity-60"
                                : selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-surface-secondary hover:border-primary hover:bg-accent",
                            )}
                            onClick={() => toggleSlot(day.value, time)}
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

        <aside className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-base font-semibold text-foreground">선택된 가능 시간</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedWorker.name} 근무자의 가능 시간이 {selectedAvailability.length}개 선택됐습니다.
          </p>

          <div className="mt-5 space-y-2">
            {selectedAvailability.length > 0 ? (
              selectedAvailability
                .sort(
                  (a, b) =>
                    DAYS.findIndex((day) => day.value === a.dayOfWeek) -
                      DAYS.findIndex((day) => day.value === b.dayOfWeek) ||
                    a.startTime.localeCompare(b.startTime),
                )
                .map((slot) => (
                  <div
                    key={getSlotKey(slot.workerId, slot.dayOfWeek, slot.startTime)}
                    className="flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {DAYS.find((day) => day.value === slot.dayOfWeek)?.label}
                    </span>
                    <span className="text-muted-foreground">
                      {slot.startTime}-{minutesToTime(timeToMinutes(slot.startTime) + 30)}
                    </span>
                  </div>
                ))
            ) : (
              <p className="rounded-md bg-surface-secondary px-3 py-8 text-center text-sm text-muted-foreground">
                선택된 가능 시간이 없습니다.
              </p>
            )}
          </div>
        </aside>
      </div>
    </AdminPageShell>
  );
}
