import type {
  MinimumStaffingRule,
  OrganizationBusinessHour,
  WorkerAvailableTime,
} from "@fragment/database";

import { addDays, dateToTimeString, parseTimeToMinutes, timeStringToDate } from "@/utils/date-time";
import { getDayOfWeek } from "@/utils/day-of-week";

type TimeRange = {
  startMinutes: number;
  endMinutes: number;
};

export type SchedulableRange = TimeRange & {
  requiredCount: number;
};

export type PrunedAvailabilityTime = {
  workerId: bigint;
  availableDate: Date;
  startsAt: Date;
  endsAt: Date;
};

const MINUTES_IN_DAY = 24 * 60;

const timeDateToMinutes = (time: Date) => parseTimeToMinutes(dateToTimeString(time));

export const createDateTimeFromMinutes = (date: Date, minutes: number) => {
  const dayOffset = Math.floor(minutes / MINUTES_IN_DAY);
  const minutesInDay = minutes % MINUTES_IN_DAY;
  const hour = Math.floor(minutesInDay / 60);
  const minute = minutesInDay % 60;
  const targetDate = addDays(date, dayOffset);

  return new Date(
    Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      hour,
      minute,
      0,
    ),
  );
};

export const minutesToTimeDate = (minutes: number) => {
  const minutesInDay = minutes % MINUTES_IN_DAY;
  const hour = Math.floor(minutesInDay / 60);
  const minute = minutesInDay % 60;

  return timeStringToDate(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
};

const getBusinessHourRange = (
  businessHours: OrganizationBusinessHour[],
  workDate: Date,
): TimeRange | null => {
  const dayOfWeek = getDayOfWeek(workDate);
  const businessHour = businessHours.find((item) => item.dayOfWeek === dayOfWeek);

  if (!businessHour || businessHour.isClosed || !businessHour.openTime || !businessHour.closeTime) {
    return null;
  }

  const startMinutes = timeDateToMinutes(businessHour.openTime);
  const rawEndMinutes = timeDateToMinutes(businessHour.closeTime);

  return {
    endMinutes: businessHour.closesNextDay ? rawEndMinutes + MINUTES_IN_DAY : rawEndMinutes,
    startMinutes,
  };
};

const getRuleRange = (rule: MinimumStaffingRule): SchedulableRange => {
  const startMinutes = timeDateToMinutes(rule.startTime);
  const rawEndMinutes = timeDateToMinutes(rule.endTime);

  return {
    endMinutes: rule.endsNextDay ? rawEndMinutes + MINUTES_IN_DAY : rawEndMinutes,
    requiredCount: rule.requiredCount,
    startMinutes,
  };
};

const mergeRanges = (ranges: TimeRange[]): TimeRange[] => {
  const sortedRanges = [...ranges]
    .filter((range) => range.startMinutes < range.endMinutes)
    .sort((first, second) => first.startMinutes - second.startMinutes);
  const mergedRanges: TimeRange[] = [];

  for (const range of sortedRanges) {
    const previous = mergedRanges.at(-1);

    if (previous && range.startMinutes <= previous.endMinutes) {
      previous.endMinutes = Math.max(previous.endMinutes, range.endMinutes);
      continue;
    }

    mergedRanges.push({ ...range });
  }

  return mergedRanges;
};

const dateTimeToMinutesFromWorkDate = (workDate: Date, dateTime: Date) =>
  Math.round((dateTime.getTime() - workDate.getTime()) / 60000);

export const getSchedulableRangesForDate = ({
  businessHours,
  rules,
  workDate,
}: {
  businessHours: OrganizationBusinessHour[];
  rules: MinimumStaffingRule[];
  workDate: Date;
}): SchedulableRange[] => {
  const businessHourRange = getBusinessHourRange(businessHours, workDate);

  if (!businessHourRange) {
    return [];
  }

  return rules
    .filter((rule) => rule.dayOfWeek === getDayOfWeek(workDate))
    .map(getRuleRange)
    .map((ruleRange) => ({
      endMinutes: Math.min(ruleRange.endMinutes, businessHourRange.endMinutes),
      requiredCount: ruleRange.requiredCount,
      startMinutes: Math.max(ruleRange.startMinutes, businessHourRange.startMinutes),
    }))
    .filter((range) => range.startMinutes < range.endMinutes);
};

export const getMergedSchedulableRangesForDate = ({
  businessHours,
  rules,
  workDate,
}: {
  businessHours: OrganizationBusinessHour[];
  rules: MinimumStaffingRule[];
  workDate: Date;
}): TimeRange[] =>
  mergeRanges(
    getSchedulableRangesForDate({
      businessHours,
      rules,
      workDate,
    }),
  );

export const pruneAvailabilityTimeToSchedulableRanges = ({
  availableTime,
  businessHours,
  rules,
}: {
  availableTime: Pick<WorkerAvailableTime, "availableDate" | "endsAt" | "startsAt" | "workerId">;
  businessHours: OrganizationBusinessHour[];
  rules: MinimumStaffingRule[];
}): PrunedAvailabilityTime[] => {
  const ranges = getMergedSchedulableRangesForDate({
    businessHours,
    rules,
    workDate: availableTime.availableDate,
  });
  const availabilityStartMinutes = dateTimeToMinutesFromWorkDate(
    availableTime.availableDate,
    availableTime.startsAt,
  );
  const availabilityEndMinutes = dateTimeToMinutesFromWorkDate(
    availableTime.availableDate,
    availableTime.endsAt,
  );

  return ranges.flatMap((range) => {
    const startMinutes = Math.max(availabilityStartMinutes, range.startMinutes);
    const endMinutes = Math.min(availabilityEndMinutes, range.endMinutes);

    if (startMinutes >= endMinutes) {
      return [];
    }

    return [
      {
        availableDate: availableTime.availableDate,
        endsAt: createDateTimeFromMinutes(availableTime.availableDate, endMinutes),
        startsAt: createDateTimeFromMinutes(availableTime.availableDate, startMinutes),
        workerId: availableTime.workerId,
      },
    ];
  });
};

export const pruneAvailabilityTimesToSchedulableRanges = ({
  availableTimes,
  businessHours,
  rules,
}: {
  availableTimes: Pick<WorkerAvailableTime, "availableDate" | "endsAt" | "startsAt" | "workerId">[];
  businessHours: OrganizationBusinessHour[];
  rules: MinimumStaffingRule[];
}): PrunedAvailabilityTime[] =>
  availableTimes.flatMap((availableTime) =>
    pruneAvailabilityTimeToSchedulableRanges({
      availableTime,
      businessHours,
      rules,
    }),
  );
