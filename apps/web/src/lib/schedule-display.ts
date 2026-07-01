import type { ScheduleAssignment } from "@fragment/shared";

const MINUTES_IN_DAY = 24 * 60;
const DEFAULT_MAX_VISIBLE_WORKER_NAMES = 2;

export type ScheduleTimeGroupingItem = {
  displayEndTime?: string;
  displayStartTime?: string;
  endTime: string;
  startTime: string;
  workerName: string;
};

export type ScheduleTimeGroup<TItem extends ScheduleTimeGroupingItem> = {
  displayEndTime: string;
  displayStartTime: string;
  endTime: string;
  id: string;
  items: TItem[];
  startTime: string;
  workerNames: string[];
};

function dateToUtcTimestamp(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return Date.UTC(year, month - 1, day);
}

function minutesToTime(minutes: number) {
  const normalizedMinutes = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hours = Math.floor(normalizedMinutes / 60);
  const restMinutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(restMinutes).padStart(2, "0")}`;
}

export function getScheduleDateTimeParts(workDate: string, dateTime: string) {
  const minutesFromWorkDate = Math.round(
    (new Date(dateTime).getTime() - dateToUtcTimestamp(workDate)) / 60000,
  );

  return {
    dayOffset: Math.floor(minutesFromWorkDate / MINUTES_IN_DAY),
    time: minutesToTime(minutesFromWorkDate),
  };
}

export function formatScheduleAssignmentTime(workDate: string, dateTime: string) {
  const { dayOffset, time } = getScheduleDateTimeParts(workDate, dateTime);

  return dayOffset > 0 ? `${time}+${dayOffset}` : time;
}

export function formatScheduleAssignmentTimeWithDayPrefix(workDate: string, dateTime: string) {
  const { dayOffset, time } = getScheduleDateTimeParts(workDate, dateTime);

  return dayOffset > 0 ? `익일 ${time}` : time;
}

export function formatScheduleAssignmentTimeRange(assignment: ScheduleAssignment) {
  const startTime = formatScheduleAssignmentTimeWithDayPrefix(
    assignment.workDate,
    assignment.startsAt,
  );
  const endTime = formatScheduleAssignmentTimeWithDayPrefix(assignment.workDate, assignment.endsAt);

  return `${startTime}-${endTime}`;
}

export function getScheduleTimeRangeLabel(
  group: Pick<ScheduleTimeGroupingItem, "endTime" | "startTime"> &
    Partial<Pick<ScheduleTimeGroupingItem, "displayEndTime" | "displayStartTime">>,
) {
  return `${group.displayStartTime ?? group.startTime}-${group.displayEndTime ?? group.endTime}`;
}

export function getWorkerNamesPreview(
  workerNames: string[],
  maxVisibleWorkerNames = DEFAULT_MAX_VISIBLE_WORKER_NAMES,
) {
  const visibleWorkerNames = workerNames.slice(0, maxVisibleWorkerNames);
  const hiddenWorkerCount = workerNames.length - visibleWorkerNames.length;
  const visibleLabel = visibleWorkerNames.join(", ");

  if (hiddenWorkerCount <= 0) {
    return visibleLabel;
  }

  return `${visibleLabel} 외 ${hiddenWorkerCount}명`;
}

export function groupSchedulesByTime<TItem extends ScheduleTimeGroupingItem>(
  schedules: TItem[],
): ScheduleTimeGroup<TItem>[] {
  const groupsByTime = new Map<string, ScheduleTimeGroup<TItem>>();

  schedules.forEach((schedule) => {
    const key = `${schedule.startTime}-${schedule.endTime}-${schedule.displayStartTime ?? ""}-${
      schedule.displayEndTime ?? ""
    }`;
    const group = groupsByTime.get(key);

    if (group) {
      group.items.push(schedule);
      group.workerNames.push(schedule.workerName);
      return;
    }

    groupsByTime.set(key, {
      displayEndTime: schedule.displayEndTime ?? schedule.endTime,
      displayStartTime: schedule.displayStartTime ?? schedule.startTime,
      endTime: schedule.endTime,
      id: key,
      items: [schedule],
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
