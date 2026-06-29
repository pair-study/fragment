"use client";

import {
  DAY_OF_WEEK_VALUES,
  type OrganizationDetail,
  Availability,
  AvailabilityQuery,
  MinimumStaffingRule,
  ReplaceAvailabilityRequest,
  Worker,
} from "@fragment/shared";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@moyeorak/design-system";
import { Check } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import {
  useAvailabilityQuery,
  useReplaceAvailabilityMutation,
} from "@/features/availability/queries/availability-queries";
import {
  useActiveSchedulePlanningPeriodQuery,
  useOrganizationQuery,
  useUpsertActiveSchedulePlanningPeriodMutation,
} from "@/features/organization/queries/organization-queries";
import { useMinimumStaffingRulesQuery } from "@/features/staffing-rules/queries/staffing-rules-queries";
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
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";

type AvailabilitySlot = {
  workerId: string;
  date: string;
  startMinutes: number;
};

type BusinessHour = OrganizationDetail["businessHours"][number];
type TimeRange = {
  endMinutes: number;
  startMinutes: number;
};

const SLOT_INTERVAL_MINUTES = 30;
const TIMETABLE_DATE_COLUMN_WIDTH = 76;
const TIMETABLE_TIME_COLUMN_WIDTH = 64;
const DEFAULT_TIMETABLE_START_MINUTES = 9 * 60;
const DEFAULT_TIMETABLE_END_MINUTES = 22 * 60;
const EMPTY_WORKERS: Worker[] = [];
const EMPTY_BUSINESS_HOURS: BusinessHour[] = [];
const EMPTY_STAFFING_RULES: MinimumStaffingRule[] = [];

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
  const minutesInDay = 24 * 60;
  const normalizedMinutes = ((minutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(normalizedMinutes / 60);
  const restMinutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(restMinutes).padStart(2, "0")}`;
}

function dateTimeToStartMinutes(availableDate: string, dateTime: string) {
  const baseDate = new Date(`${availableDate}T00:00:00.000Z`);
  const targetDate = new Date(dateTime);

  return Math.round((targetDate.getTime() - baseDate.getTime()) / 60000);
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

function createTimeSlots(startMinutes: number, endMinutes: number) {
  const slots: number[] = [];

  for (let minutes = startMinutes; minutes < endMinutes; minutes += SLOT_INTERVAL_MINUTES) {
    slots.push(minutes);
  }

  return slots;
}

function getDayOfWeek(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const mondayFirstDay = day === 0 ? 6 : day - 1;

  return DAY_OF_WEEK_VALUES[mondayFirstDay];
}

function getBusinessHourForDate(businessHours: BusinessHour[], date: string) {
  return businessHours.find((businessHour) => businessHour.dayOfWeek === getDayOfWeek(date));
}

function getBusinessHourRange(businessHour: BusinessHour | undefined) {
  if (businessHour?.isClosed || !businessHour?.openTime || !businessHour.closeTime) {
    return null;
  }

  const startMinutes = timeToMinutes(businessHour.openTime);
  const endMinutes =
    timeToMinutes(businessHour.closeTime) + (businessHour.closesNextDay ? 24 * 60 : 0);

  return {
    endMinutes,
    startMinutes,
  };
}

function getStaffingRuleRanges(staffingRules: MinimumStaffingRule[], date: string): TimeRange[] {
  return staffingRules
    .filter((rule) => rule.dayOfWeek === getDayOfWeek(date))
    .map((rule) => {
      const startMinutes = timeToMinutes(rule.startTime);
      const endMinutes = timeToMinutes(rule.endTime) + (rule.endsNextDay ? 24 * 60 : 0);

      return {
        endMinutes,
        startMinutes,
      };
    })
    .filter((range) => range.startMinutes < range.endMinutes);
}

function getSchedulableRanges(
  businessHours: BusinessHour[],
  staffingRules: MinimumStaffingRule[],
  date: string,
): TimeRange[] {
  const businessHourRange = getBusinessHourRange(getBusinessHourForDate(businessHours, date));

  if (!businessHourRange) {
    return [];
  }

  return getStaffingRuleRanges(staffingRules, date)
    .map((range) => ({
      endMinutes: Math.min(range.endMinutes, businessHourRange.endMinutes),
      startMinutes: Math.max(range.startMinutes, businessHourRange.startMinutes),
    }))
    .filter((range) => range.startMinutes < range.endMinutes);
}

function getTimetableRange(
  businessHours: BusinessHour[],
  staffingRules: MinimumStaffingRule[],
  dateRange: string[],
) {
  const ranges = dateRange
    .flatMap((date) => getSchedulableRanges(businessHours, staffingRules, date))
    .filter((range) => Boolean(range));

  if (ranges.length === 0) {
    return {
      endMinutes: DEFAULT_TIMETABLE_END_MINUTES,
      startMinutes: DEFAULT_TIMETABLE_START_MINUTES,
    };
  }

  return {
    endMinutes: Math.max(...ranges.map((range) => range.endMinutes)),
    startMinutes: Math.min(...ranges.map((range) => range.startMinutes)),
  };
}

function isClosedDate(businessHours: BusinessHour[], date: string) {
  return !getBusinessHourRange(getBusinessHourForDate(businessHours, date));
}

function isSlotSchedulable(
  businessHours: BusinessHour[],
  staffingRules: MinimumStaffingRule[],
  date: string,
  startMinutes: number,
) {
  const endMinutes = startMinutes + SLOT_INTERVAL_MINUTES;

  return getSchedulableRanges(businessHours, staffingRules, date).some(
    (range) => startMinutes >= range.startMinutes && endMinutes <= range.endMinutes,
  );
}

function formatDateLabel(date: string) {
  return DATE_FORMATTER.format(new Date(`${date}T00:00:00+09:00`)).replace(". ", ".");
}

function formatWeekday(date: string) {
  return WEEKDAY_FORMATTER.format(new Date(`${date}T00:00:00+09:00`));
}

function createLocalDateTime(date: string, minutes: number) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, 0, minutes)).toISOString();
}

function formatSlotTime(minutes: number) {
  return minutes >= 24 * 60 ? `${minutesToTime(minutes)}+1` : minutesToTime(minutes);
}

function getSlotKey(workerId: string, date: string, startMinutes: number) {
  return `${workerId}:${date}:${startMinutes}`;
}

function availabilityToSlots(items: Availability[]) {
  return items.flatMap((item) => {
    const slots: AvailabilitySlot[] = [];
    const startMinutes = dateTimeToStartMinutes(item.availableDate, item.startsAt);
    const endMinutes = dateTimeToStartMinutes(item.availableDate, item.endsAt);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += SLOT_INTERVAL_MINUTES) {
      slots.push({
        date: item.availableDate,
        startMinutes: minutes,
        workerId: item.workerId,
      });
    }

    return slots;
  });
}

function hasSameSlots(firstSlots: AvailabilitySlot[], secondSlots: AvailabilitySlot[]) {
  const firstKeys = new Set(
    firstSlots.map((slot) => getSlotKey(slot.workerId, slot.date, slot.startMinutes)),
  );
  const secondKeys = new Set(
    secondSlots.map((slot) => getSlotKey(slot.workerId, slot.date, slot.startMinutes)),
  );

  if (firstKeys.size !== secondKeys.size) {
    return false;
  }

  return [...firstKeys].every((key) => secondKeys.has(key));
}

function summarizeAvailabilityByDate(slots: AvailabilitySlot[]) {
  const slotsByDate = slots.reduce<Record<string, number[]>>((acc, slot) => {
    acc[slot.date] = [...(acc[slot.date] ?? []), slot.startMinutes];
    return acc;
  }, {});

  return Object.entries(slotsByDate)
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, startMinutes]) => {
      const sortedMinutes = [...new Set(startMinutes)].sort((a, b) => a - b);
      const ranges: { endMinutes: number; startMinutes: number }[] = [];

      let rangeStart = sortedMinutes[0];
      let previous = sortedMinutes[0];

      for (const current of sortedMinutes.slice(1)) {
        if (current === previous + 30) {
          previous = current;
          continue;
        }

        ranges.push({
          endMinutes: previous + SLOT_INTERVAL_MINUTES,
          startMinutes: rangeStart,
        });
        rangeStart = current;
        previous = current;
      }

      if (rangeStart !== undefined && previous !== undefined) {
        ranges.push({
          endMinutes: previous + SLOT_INTERVAL_MINUTES,
          startMinutes: rangeStart,
        });
      }

      return {
        date,
        ranges,
      };
    });
}

function createAvailabilityItems(slots: AvailabilitySlot[]) {
  return summarizeAvailabilityByDate(slots).flatMap((group) =>
    group.ranges.map((range) => ({
      availableDate: group.date,
      endsAt: createLocalDateTime(group.date, range.endMinutes),
      startsAt: createLocalDateTime(group.date, range.startMinutes),
    })),
  );
}

export function MvpAvailabilityPage() {
  const workersQuery = useWorkersQuery();
  const organizationQuery = useOrganizationQuery();
  const staffingRulesQuery = useMinimumStaffingRulesQuery();
  const planningPeriodQuery = useActiveSchedulePlanningPeriodQuery();
  const upsertPlanningPeriodMutation = useUpsertActiveSchedulePlanningPeriodMutation();
  const replaceAvailabilityMutation = useReplaceAvailabilityMutation();
  const workers = workersQuery.data?.items ?? EMPTY_WORKERS;
  const businessHours = organizationQuery.data?.businessHours ?? EMPTY_BUSINESS_HOURS;
  const staffingRules = staffingRulesQuery.data?.items ?? EMPTY_STAFFING_RULES;
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
  const isPageLoading =
    organizationQuery.isLoading ||
    planningPeriodQuery.isLoading ||
    staffingRulesQuery.isLoading ||
    workersQuery.isLoading;
  const queryError =
    organizationQuery.error ??
    planningPeriodQuery.error ??
    staffingRulesQuery.error ??
    workersQuery.error ??
    availabilityResult.error;
  const queryErrorMessage = queryError
    ? getApiErrorMessage(queryError, "가능 시간 정보를 불러오지 못했습니다.")
    : "";
  const hasValidDateRange = Boolean(workStartDate && workEndDate) && workStartDate <= workEndDate;
  const dateRange = useMemo(
    () => createDateRange(workStartDate, workEndDate),
    [workEndDate, workStartDate],
  );
  const timetableRange = useMemo(
    () => getTimetableRange(businessHours, staffingRules, dateRange),
    [businessHours, dateRange, staffingRules],
  );
  const timeSlots = useMemo(
    () => createTimeSlots(timetableRange.startMinutes, timetableRange.endMinutes),
    [timetableRange],
  );

  useEffect(() => {
    if (!planningPeriodQuery.data) {
      return;
    }

    if (!activePlanningPeriod) {
      setWorkStartDate("");
      setWorkEndDate("");
      return;
    }

    setWorkStartDate(activePlanningPeriod.startDate);
    setWorkEndDate(activePlanningPeriod.endDate);
  }, [activePlanningPeriod, planningPeriodQuery.data]);

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
      slot.workerId === selectedWorkerId &&
      slot.date >= workStartDate &&
      slot.date <= workEndDate &&
      isSlotSchedulable(businessHours, staffingRules, slot.date, slot.startMinutes),
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
    selectedDraftAvailability.map((slot) =>
      getSlotKey(slot.workerId, slot.date, slot.startMinutes),
    ),
  );
  const hasUnsavedChanges = !hasSameSlots(savedAvailability, draftAvailability);
  const canSaveAvailability =
    hasUnsavedChanges &&
    hasValidDateRange &&
    Boolean(selectedWorkerId) &&
    !availabilityResult.isFetching &&
    !queryErrorMessage;

  function toggleSlot(date: string, startMinutes: number) {
    if (!selectedWorkerId || queryErrorMessage || availabilityResult.isFetching) {
      return;
    }

    if (!isSlotSchedulable(businessHours, staffingRules, date, startMinutes)) {
      return;
    }

    const key = getSlotKey(selectedWorkerId, date, startMinutes);
    const selected = draftSlotKeys.has(key);

    setDraftAvailability((currentAvailability) =>
      selected
        ? currentAvailability.filter(
            (slot) => getSlotKey(slot.workerId, slot.date, slot.startMinutes) !== key,
          )
        : [
            ...currentAvailability,
            {
              workerId: selectedWorkerId,
              date,
              startMinutes,
            },
          ],
    );
    setSaveMessage("");
  }

  async function saveAvailability() {
    if (!canSaveAvailability) {
      return;
    }

    const request: ReplaceAvailabilityRequest = {
      endDate: workEndDate,
      items: createAvailabilityItems(selectedDraftAvailability),
      startDate: workStartDate,
      workerId: selectedWorkerId,
    };

    try {
      const response = await replaceAvailabilityMutation.mutateAsync(request);
      const slots = availabilityToSlots(response.items);

      setSavedAvailability(slots);
      setDraftAvailability(slots);
      setSaveMessage("가능 시간이 저장되었습니다.");
    } catch (error) {
      setSaveMessage(getApiErrorMessage(error, "가능 시간 저장에 실패했습니다."));
    }
  }

  function savePlanningPeriod(nextStartDate: string, nextEndDate: string) {
    if (!nextStartDate || !nextEndDate || nextEndDate < nextStartDate) {
      return;
    }

    if (
      activePlanningPeriod?.startDate === nextStartDate &&
      activePlanningPeriod.endDate === nextEndDate
    ) {
      return;
    }

    upsertPlanningPeriodMutation.mutate(
      {
        endDate: nextEndDate,
        startDate: nextStartDate,
      },
      {
        onError: (error) => {
          setSaveMessage(getApiErrorMessage(error, "근무 기간 저장에 실패했습니다."));
        },
      },
    );
  }

  return (
    <AdminPageShell
      title="가능 시간 관리"
      description="근무 기간을 정하고, 최소 인원 조건이 있는 시간대에 근무자별 가능 시간을 30분 단위로 선택한 뒤 저장합니다."
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!hasUnsavedChanges || replaceAvailabilityMutation.isPending}
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
            disabled={!canSaveAvailability || replaceAvailabilityMutation.isPending}
            onClick={() => {
              void saveAvailability();
            }}
          >
            {replaceAvailabilityMutation.isPending ? "저장 중" : "변경사항 저장"}
          </Button>
        </div>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      {isPageLoading ? (
        <div className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted-foreground">
          가능 시간 정보를 불러오는 중입니다.
        </div>
      ) : null}

      {queryErrorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {queryErrorMessage}
        </div>
      ) : null}

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
                disabled={isPageLoading}
                value={workStartDate}
                onChange={(event) => {
                  const nextStartDate = event.target.value;

                  setWorkStartDate(nextStartDate);
                  setSelectedAvailabilityDate("");
                  setSaveMessage("");
                  savePlanningPeriod(nextStartDate, workEndDate);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability-work-end-date">근무 종료 날짜</Label>
              <Input
                id="availability-work-end-date"
                type="date"
                disabled={isPageLoading}
                value={workEndDate}
                onChange={(event) => {
                  const nextEndDate = event.target.value;

                  setWorkEndDate(nextEndDate);
                  setSelectedAvailabilityDate("");
                  setSaveMessage("");
                  savePlanningPeriod(workStartDate, nextEndDate);
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
              disabled={isPageLoading || workers.length === 0}
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
                  주간 계약 시간: 주 {selectedWorker.weeklyContractHours}시간 · 운영 시간은 요일별
                  조직 설정과 최소 인원 조건을 따릅니다.
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
                    key={`${activeAvailabilityDate}-${range.startMinutes}`}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    {formatSlotTime(range.startMinutes)}~{formatSlotTime(range.endMinutes)}
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
                최소 인원 조건이 있는 셀만 선택할 수 있습니다. 선택된 셀을 다시 누르면 삭제됩니다.
              </p>
            </div>
            {hasUnsavedChanges ? <Badge variant="brand-weak">저장 전 변경 있음</Badge> : null}
            {availabilityResult.isFetching ? (
              <Badge variant="neutral-weak">불러오는 중</Badge>
            ) : null}
          </div>
        </div>

        <div className="max-w-full overflow-x-auto overflow-y-hidden p-4">
          <div className="w-max min-w-max">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `${TIMETABLE_TIME_COLUMN_WIDTH}px repeat(${dateRange.length}, ${TIMETABLE_DATE_COLUMN_WIDTH}px)`,
              }}
            >
              <div />
              {dateRange.map((date) => (
                <div key={date} className="py-2 text-center">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {formatWeekday(date)}
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">{formatDateLabel(date)}</p>
                  {isClosedDate(businessHours, date) ? (
                    <Badge variant="neutral-weak" size="sm" className="mt-2">
                      휴무
                    </Badge>
                  ) : getSchedulableRanges(businessHours, staffingRules, date).length === 0 ? (
                    <Badge variant="neutral-weak" size="sm" className="mt-2">
                      조건 없음
                    </Badge>
                  ) : null}
                </div>
              ))}

              {timeSlots.map((startMinutes) => {
                const showHourLabel = startMinutes % 60 === 0;
                const timeLabel = formatSlotTime(startMinutes);

                return (
                  <div key={startMinutes} className="contents">
                    <div className="h-8 pr-2 text-right text-sm text-muted-foreground">
                      {showHourLabel ? timeLabel : ""}
                    </div>
                    {dateRange.map((date) => {
                      const disabled = !isSlotSchedulable(
                        businessHours,
                        staffingRules,
                        date,
                        startMinutes,
                      );
                      const selected = draftSlotKeys.has(
                        getSlotKey(selectedWorkerId, date, startMinutes),
                      );
                      const disabledByState =
                        disabled ||
                        !selectedWorkerId ||
                        !hasValidDateRange ||
                        Boolean(queryErrorMessage) ||
                        availabilityResult.isFetching;

                      return (
                        <button
                          key={`${date}-${startMinutes}`}
                          type="button"
                          disabled={disabledByState}
                          aria-pressed={selected}
                          aria-label={`${date} ${timeLabel} 가능 시간 ${selected ? "해제" : "선택"}`}
                          className={cn(
                            "flex h-8 items-center justify-center rounded-md border text-[10px] transition-colors",
                            disabledByState
                              ? "cursor-not-allowed border-border bg-muted/60 text-muted-foreground opacity-60"
                              : selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-surface-secondary hover:border-primary hover:bg-accent",
                          )}
                          onClick={() => toggleSlot(date, startMinutes)}
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
