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
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button } from "@moyeorak/design-system";
import { CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react";

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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
const CALENDAR_WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Seoul",
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  weekday: "short",
  timeZone: "Asia/Seoul",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

const TODAY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Seoul",
  year: "numeric",
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

function addMonths(date: string, months: number) {
  const [year, month] = date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1 + months, 1));
  return nextDate.toISOString().slice(0, 10);
}

function getMonthStartDate(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function createCalendarMonthDates(monthDate: string) {
  const [year, month] = monthDate.split("-").map(Number);
  const firstDate = new Date(Date.UTC(year, month - 1, 1));
  const day = firstDate.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const firstCalendarDate = addDays(monthDate, mondayOffset);

  return Array.from({ length: 42 }, (_, index) => addDays(firstCalendarDate, index));
}

function getTodayDate() {
  return TODAY_FORMATTER.format(new Date());
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

function formatDateWithWeekday(date: string) {
  return `${formatDateLabel(date)}(${formatWeekday(date)})`;
}

function formatMonthLabel(date: string) {
  return MONTH_FORMATTER.format(new Date(`${date}T00:00:00+09:00`));
}

function createLocalDateTime(date: string, minutes: number) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, 0, minutes)).toISOString();
}

function formatSlotTime(minutes: number) {
  return minutes >= 24 * 60 ? `익일 ${minutesToTime(minutes)}` : minutesToTime(minutes);
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
  const [workPeriodDialogOpen, setWorkPeriodDialogOpen] = useState(false);
  const [calendarMonthDate, setCalendarMonthDate] = useState(() =>
    getMonthStartDate(getTodayDate()),
  );
  const [workStartDate, setWorkStartDate] = useState("");
  const [workEndDate, setWorkEndDate] = useState("");
  const [savedAvailability, setSavedAvailability] = useState<AvailabilitySlot[]>([]);
  const [draftAvailability, setDraftAvailability] = useState<AvailabilitySlot[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const dragSelectionRef = useRef<{
    lastColumnIndex: number;
    lastRowIndex: number;
    shouldSelect: boolean;
    visitedKeys: Set<string>;
  } | null>(null);
  const suppressNextCellClickRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const availabilityQuery: AvailabilityQuery = useMemo(
    () => ({
      endDate: workEndDate,
      startDate: workStartDate,
      workerId: selectedWorkerId,
    }),
    [selectedWorkerId, workEndDate, workStartDate],
  );
  const isPageLoading =
    organizationQuery.isLoading ||
    planningPeriodQuery.isLoading ||
    staffingRulesQuery.isLoading ||
    workersQuery.isLoading;
  const hasValidDateRange = Boolean(workStartDate && workEndDate) && workStartDate <= workEndDate;
  const hasMatchingPlanningPeriod = Boolean(
    activePlanningPeriod &&
    hasValidDateRange &&
    activePlanningPeriod.startDate === workStartDate &&
    activePlanningPeriod.endDate === workEndDate,
  );
  const canFetchAvailability = hasMatchingPlanningPeriod && Boolean(selectedWorkerId);
  const availabilityResult = useAvailabilityQuery(availabilityQuery, canFetchAvailability);
  const queryError =
    organizationQuery.error ??
    planningPeriodQuery.error ??
    staffingRulesQuery.error ??
    workersQuery.error ??
    availabilityResult.error;
  const queryErrorMessage = queryError
    ? getApiErrorMessage(queryError, "가능 시간 정보를 불러오지 못했습니다.")
    : "";
  const dateRange = useMemo(
    () => createDateRange(workStartDate, workEndDate),
    [workEndDate, workStartDate],
  );
  const closedDates = useMemo(
    () => dateRange.filter((date) => isClosedDate(businessHours, date)),
    [businessHours, dateRange],
  );
  const datesWithoutStaffingRules = useMemo(
    () =>
      dateRange.filter(
        (date) =>
          !isClosedDate(businessHours, date) &&
          getSchedulableRanges(businessHours, staffingRules, date).length === 0,
      ),
    [businessHours, dateRange, staffingRules],
  );
  const visibleTimetableDates = useMemo(
    () =>
      dateRange.filter(
        (date) => getSchedulableRanges(businessHours, staffingRules, date).length > 0,
      ),
    [businessHours, dateRange, staffingRules],
  );
  const timetableRange = useMemo(
    () => getTimetableRange(businessHours, staffingRules, dateRange),
    [businessHours, dateRange, staffingRules],
  );
  const timeSlots = useMemo(
    () => createTimeSlots(timetableRange.startMinutes, timetableRange.endMinutes),
    [timetableRange],
  );
  const calendarDates = useMemo(
    () => createCalendarMonthDates(calendarMonthDate),
    [calendarMonthDate],
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

    if (
      hasUnsavedChangesRef.current &&
      (activePlanningPeriod.startDate !== workStartDate ||
        activePlanningPeriod.endDate !== workEndDate)
    ) {
      setSaveMessage("가능 시간을 저장하거나 변경 취소한 뒤 근무 기간 변경을 반영해 주세요.");
      return;
    }

    setWorkStartDate(activePlanningPeriod.startDate);
    setWorkEndDate(activePlanningPeriod.endDate);
    setCalendarMonthDate(getMonthStartDate(activePlanningPeriod.startDate));
  }, [activePlanningPeriod, planningPeriodQuery.data, workEndDate, workStartDate]);

  useEffect(() => {
    if (workers.length === 0) {
      setSelectedWorkerId("");
      return;
    }

    if (!workers.some((worker) => worker.id === selectedWorkerId)) {
      if (hasUnsavedChangesRef.current && selectedWorkerId) {
        setSaveMessage("가능 시간을 저장하거나 변경 취소한 뒤 근무자 변경을 반영해 주세요.");
        return;
      }

      setSelectedWorkerId(workers[0].id);
      setSelectedAvailabilityDate("");
      setSaveMessage("");
    }
  }, [selectedWorkerId, workers]);

  useEffect(() => {
    const slots = availabilityToSlots(availabilityResult.data?.items ?? []);

    if (hasUnsavedChangesRef.current) {
      setSaveMessage(
        "가능 시간을 저장하거나 변경 취소한 뒤 새 가능 시간 데이터를 불러올 수 있습니다.",
      );
      return;
    }

    setSavedAvailability(slots);
    setDraftAvailability(slots);
    setSelectedAvailabilityDate("");
    setSaveMessage("");
  }, [availabilityResult.data]);

  useEffect(() => {
    function stopDragSelection() {
      dragSelectionRef.current = null;
      window.setTimeout(() => {
        suppressNextCellClickRef.current = false;
      }, 0);
    }

    window.addEventListener("pointerup", stopDragSelection);
    window.addEventListener("pointercancel", stopDragSelection);

    return () => {
      window.removeEventListener("pointerup", stopDragSelection);
      window.removeEventListener("pointercancel", stopDragSelection);
    };
  }, []);

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
  const draftSlotKeys = new Set(
    selectedDraftAvailability.map((slot) =>
      getSlotKey(slot.workerId, slot.date, slot.startMinutes),
    ),
  );
  const hasUnsavedChanges = !hasSameSlots(savedAvailability, draftAvailability);
  const canSaveAvailability =
    hasUnsavedChanges &&
    hasMatchingPlanningPeriod &&
    hasValidDateRange &&
    Boolean(selectedWorkerId) &&
    !availabilityResult.isFetching &&
    !queryErrorMessage;

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  function updateSlotSelections(
    slots: { date: string; startMinutes: number }[],
    shouldSelect: boolean,
  ) {
    if (!selectedWorkerId || queryErrorMessage || availabilityResult.isFetching) {
      return;
    }

    const schedulableSlots = slots.filter((slot) =>
      isSlotSchedulable(businessHours, staffingRules, slot.date, slot.startMinutes),
    );

    if (schedulableSlots.length === 0) {
      return;
    }

    const targetKeys = new Set(
      schedulableSlots.map((slot) => getSlotKey(selectedWorkerId, slot.date, slot.startMinutes)),
    );

    setDraftAvailability((currentAvailability) => {
      const currentKeys = new Set(
        currentAvailability.map((slot) => getSlotKey(slot.workerId, slot.date, slot.startMinutes)),
      );

      return shouldSelect
        ? [
            ...currentAvailability,
            ...schedulableSlots
              .filter(
                (slot) =>
                  !currentKeys.has(getSlotKey(selectedWorkerId, slot.date, slot.startMinutes)),
              )
              .map((slot) => ({
                date: slot.date,
                startMinutes: slot.startMinutes,
                workerId: selectedWorkerId,
              })),
          ]
        : currentAvailability.filter(
            (slot) => !targetKeys.has(getSlotKey(slot.workerId, slot.date, slot.startMinutes)),
          );
    });
    setSaveMessage("");
  }

  function toggleSlot(date: string, startMinutes: number) {
    const key = getSlotKey(selectedWorkerId, date, startMinutes);
    updateSlotSelections([{ date, startMinutes }], !draftSlotKeys.has(key));
  }

  function applySlotDragRange(
    fromRowIndex: number,
    fromColumnIndex: number,
    toRowIndex: number,
    toColumnIndex: number,
  ) {
    const dragSelection = dragSelectionRef.current;

    if (!dragSelection) {
      return;
    }

    const rowStart = Math.min(fromRowIndex, toRowIndex);
    const rowEnd = Math.max(fromRowIndex, toRowIndex);
    const columnStart = Math.min(fromColumnIndex, toColumnIndex);
    const columnEnd = Math.max(fromColumnIndex, toColumnIndex);
    const slots: { date: string; startMinutes: number }[] = [];

    for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
      const startMinutes = timeSlots[rowIndex];

      if (startMinutes === undefined) {
        continue;
      }

      for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex += 1) {
        const date = visibleTimetableDates[columnIndex];

        if (!date) {
          continue;
        }

        const key = getSlotKey(selectedWorkerId, date, startMinutes);

        if (dragSelection.visitedKeys.has(key)) {
          continue;
        }

        dragSelection.visitedKeys.add(key);
        slots.push({ date, startMinutes });
      }
    }

    updateSlotSelections(slots, dragSelection.shouldSelect);
  }

  function startSlotDrag(
    date: string,
    startMinutes: number,
    rowIndex: number,
    columnIndex: number,
  ) {
    const key = getSlotKey(selectedWorkerId, date, startMinutes);
    const shouldSelect = !draftSlotKeys.has(key);

    dragSelectionRef.current = {
      lastColumnIndex: columnIndex,
      lastRowIndex: rowIndex,
      shouldSelect,
      visitedKeys: new Set(),
    };
    suppressNextCellClickRef.current = true;
    applySlotDragRange(rowIndex, columnIndex, rowIndex, columnIndex);
  }

  function moveSlotDrag(clientX: number, clientY: number) {
    const dragSelection = dragSelectionRef.current;

    if (!dragSelection) {
      return;
    }

    const element = document.elementFromPoint(clientX, clientY);
    const cell = element?.closest<HTMLElement>("[data-availability-cell='true']");

    if (!cell) {
      return;
    }

    const rowIndex = Number(cell.dataset.rowIndex);
    const columnIndex = Number(cell.dataset.columnIndex);

    if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) {
      return;
    }

    applySlotDragRange(
      dragSelection.lastRowIndex,
      dragSelection.lastColumnIndex,
      rowIndex,
      columnIndex,
    );
    dragSelection.lastRowIndex = rowIndex;
    dragSelection.lastColumnIndex = columnIndex;
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

  function selectWorkDate(date: string) {
    if (isPageLoading) {
      return;
    }

    if (hasUnsavedChanges) {
      setSaveMessage("가능 시간을 저장하거나 변경 취소한 뒤 근무 기간을 변경해 주세요.");
      setWorkPeriodDialogOpen(false);
      return;
    }

    if (!workStartDate || (workStartDate && workEndDate) || date < workStartDate) {
      setWorkStartDate(date);
      setWorkEndDate("");
      setSelectedAvailabilityDate("");
      setSaveMessage("");
      return;
    }

    setWorkEndDate(date);
    setSelectedAvailabilityDate("");
    setSaveMessage("");
    setWorkPeriodDialogOpen(false);
    savePlanningPeriod(workStartDate, date);
  }

  return (
    <AdminPageShell
      title="가능 시간 관리"
      description="근무 기간을 정하고, 최소 인원 조건이 있는 시간대에 근무자별 가능 시간을 30분 단위로 선택한 뒤 저장합니다."
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">근무 기간 설정</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              모든 근무자의 가능 시간 입력에 공통으로 적용되는 기간입니다.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface-secondary px-4 py-2 text-sm">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium text-foreground">선택 기간</span>
              <span className="tabular-nums text-muted-foreground">
                {workStartDate && workEndDate
                  ? `${formatDateWithWeekday(workStartDate)} - ${formatDateWithWeekday(workEndDate)}`
                  : workStartDate
                    ? `${formatDateWithWeekday(workStartDate)} - 종료일 선택`
                    : "시작일 선택"}
              </span>
            </div>
            <Dialog open={workPeriodDialogOpen} onOpenChange={setWorkPeriodDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" disabled={isPageLoading}>
                  기간 선택
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>근무 기간 선택</DialogTitle>
                  <DialogDescription>
                    시작일을 먼저 선택하고 종료일을 선택하면 근무 기간이 저장됩니다.
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-label="이전 달"
                      disabled={isPageLoading}
                      className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => setCalendarMonthDate(addMonths(calendarMonthDate, -1))}
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </button>
                    <p className="text-sm font-semibold text-foreground">
                      {formatMonthLabel(calendarMonthDate)}
                    </p>
                    <button
                      type="button"
                      aria-label="다음 달"
                      disabled={isPageLoading}
                      className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => setCalendarMonthDate(addMonths(calendarMonthDate, 1))}
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                    {CALENDAR_WEEKDAYS.map((weekday) => (
                      <div key={weekday} className="py-1">
                        {weekday}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {calendarDates.map((date) => {
                      const inCurrentMonth = date.slice(0, 7) === calendarMonthDate.slice(0, 7);
                      const rangeStart = date === workStartDate;
                      const rangeEnd = date === workEndDate;
                      const inRange = Boolean(workStartDate && workEndDate)
                        ? date > workStartDate && date < workEndDate
                        : false;
                      const selected = rangeStart || rangeEnd;

                      return (
                        <button
                          key={date}
                          type="button"
                          aria-pressed={selected || inRange}
                          aria-label={`${formatDateWithWeekday(date)} 선택`}
                          disabled={isPageLoading}
                          className={cn(
                            "flex size-10 items-center justify-center rounded-md text-sm font-medium tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                            inCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                            inRange ? "bg-primary/10 text-primary" : "hover:bg-accent",
                            selected ? "bg-primary text-primary-foreground hover:bg-primary" : "",
                          )}
                          onClick={() => selectWorkDate(date)}
                        >
                          {Number(date.slice(8, 10))}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      닫기
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {hasValidDateRange ? (
          <div className="mt-4 rounded-lg border border-border bg-surface-secondary px-4 py-3">
            <p className="text-sm font-semibold text-foreground">입력 제외 날짜</p>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <span className="font-medium text-foreground">휴무일</span>
                {closedDates.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {closedDates.map((date) => (
                      <span
                        key={date}
                        className="rounded-full border border-border bg-card px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground"
                      >
                        {formatDateWithWeekday(date)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="ml-2 text-muted-foreground">없음</span>
                )}
              </div>

              <div>
                <span className="font-medium text-foreground">최소 인원 조건 미설정일</span>
                {datesWithoutStaffingRules.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {datesWithoutStaffingRules.map((date) => (
                      <span
                        key={date}
                        className="rounded-full border border-border bg-card px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground"
                      >
                        {formatDateWithWeekday(date)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="ml-2 text-muted-foreground">없음</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {hasMatchingPlanningPeriod ? (
        <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">가능 시간 입력</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    근무자를 선택한 뒤 최소 인원 조건이 있는 셀만 가능 시간으로 지정합니다.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {availabilityResult.isFetching ? (
                    <Badge variant="neutral-weak">불러오는 중</Badge>
                  ) : null}
                  {hasUnsavedChanges ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={replaceAvailabilityMutation.isPending}
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
                        {replaceAvailabilityMutation.isPending ? "저장 중" : "저장"}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <Label>근무자</Label>
                {workers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {workers.map((worker) => {
                      const selected = worker.id === selectedWorkerId;

                      return (
                        <button
                          key={worker.id}
                          type="button"
                          aria-pressed={selected}
                          disabled={isPageLoading}
                          className={cn(
                            "inline-flex min-h-10 items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-xs"
                              : "border-border bg-surface-secondary text-foreground hover:border-primary hover:bg-accent",
                          )}
                          onClick={() => {
                            if (worker.id === selectedWorkerId) {
                              return;
                            }

                            if (hasUnsavedChanges) {
                              setSaveMessage(
                                "가능 시간을 저장하거나 변경 취소한 뒤 다른 근무자를 선택해 주세요.",
                              );
                              return;
                            }

                            setSelectedWorkerId(worker.id);
                            setSelectedAvailabilityDate("");
                            setSaveMessage("");
                          }}
                        >
                          {selected ? <Check className="size-4" aria-hidden="true" /> : null}
                          <span>{worker.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">등록된 근무자가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {saveMessage ? (
            <div className="border-b border-border bg-surface-secondary px-6 py-3 text-sm text-muted-foreground">
              {saveMessage}
            </div>
          ) : null}

          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold text-foreground">선택된 가능 시간</h3>

            {selectedAvailabilityByDate.length > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="max-w-full overflow-x-auto pb-1">
                  <div className="flex w-max min-w-max gap-2">
                    {selectedAvailabilityByDate.map((group) => {
                      const selected = group.date === activeAvailabilityDate;

                      return (
                        <button
                          key={group.date}
                          type="button"
                          aria-pressed={selected}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-surface-secondary text-foreground hover:border-primary hover:bg-accent",
                          )}
                          onClick={() => setSelectedAvailabilityDate(group.date)}
                        >
                          {formatDateWithWeekday(group.date)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg bg-surface-secondary px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {activeAvailabilityRanges.map((range) => (
                      <Badge
                        key={`${activeAvailabilityDate}-${range.startMinutes}`}
                        variant="neutral-weak"
                        className="rounded-md px-2.5 py-1 text-sm font-medium tabular-nums text-foreground"
                      >
                        {formatSlotTime(range.startMinutes)}~{formatSlotTime(range.endMinutes)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">선택된 가능 시간이 없습니다.</p>
            )}
          </div>

          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold text-foreground">가능 시간 타임테이블</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              최소 인원 조건이 있는 셀만 선택할 수 있습니다. 선택된 셀을 다시 누르면 삭제됩니다.
            </p>
          </div>

          {visibleTimetableDates.length > 0 ? (
            <div className="max-w-full overflow-x-auto overflow-y-hidden p-4">
              <div className="w-max min-w-max">
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `${TIMETABLE_TIME_COLUMN_WIDTH}px repeat(${visibleTimetableDates.length}, ${TIMETABLE_DATE_COLUMN_WIDTH}px)`,
                  }}
                  onPointerMove={(event) => moveSlotDrag(event.clientX, event.clientY)}
                >
                  <div />
                  {visibleTimetableDates.map((date) => (
                    <div key={date} className="py-2 text-center">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {formatWeekday(date)}
                      </p>
                      <p className="mt-1 text-sm font-bold text-foreground">
                        {formatDateLabel(date)}
                      </p>
                    </div>
                  ))}

                  {timeSlots.map((startMinutes, rowIndex) => {
                    const showHourLabel = startMinutes % 60 === 0;
                    const timeLabel = formatSlotTime(startMinutes);

                    return (
                      <div key={startMinutes} className="contents">
                        <div className="h-8 pr-2 text-right text-sm text-muted-foreground">
                          {showHourLabel ? timeLabel : ""}
                        </div>
                        {visibleTimetableDates.map((date, columnIndex) => {
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
                              data-availability-cell="true"
                              data-column-index={columnIndex}
                              data-row-index={rowIndex}
                              disabled={disabledByState}
                              aria-pressed={selected}
                              aria-label={`${date} ${timeLabel} 가능 시간 ${
                                selected ? "해제" : "선택"
                              }`}
                              className={cn(
                                "flex h-8 touch-none select-none items-center justify-center rounded-md border transition-colors",
                                disabledByState
                                  ? "cursor-not-allowed border-border/40 bg-surface-secondary/40 opacity-45"
                                  : selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-surface-secondary hover:border-primary hover:bg-accent",
                              )}
                              onClick={() => {
                                if (suppressNextCellClickRef.current) {
                                  suppressNextCellClickRef.current = false;
                                  return;
                                }

                                toggleSlot(date, startMinutes);
                              }}
                              onPointerDown={(event) => {
                                if (event.pointerType === "mouse" && event.button !== 0) {
                                  return;
                                }

                                event.preventDefault();
                                startSlotDrag(date, startMinutes, rowIndex, columnIndex);
                              }}
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
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">입력 가능한 날짜가 없습니다.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                근무 기간 설정에서 휴무일과 최소 인원 조건 미설정일을 확인해 주세요.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </AdminPageShell>
  );
}
