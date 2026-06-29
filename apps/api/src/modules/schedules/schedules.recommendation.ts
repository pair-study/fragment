import { createHash } from "node:crypto";
import type {
  DayOfWeek,
  MinimumStaffingRule,
  OrganizationBusinessHour,
  Worker,
  WorkerAvailableTime,
} from "@fragment/database";

import { dateToDateString, dateToTimeString } from "@/utils/date-time";
import { eachDateInRange } from "@/utils/date-range";
import { getDayOfWeek } from "@/utils/day-of-week";
import { toApiId } from "@/utils/mapper";
import {
  createDateTimeFromMinutes,
  getSchedulableRangesForDate,
  minutesToTimeDate,
} from "@/modules/scheduling-time-policy";

type RecommendationAssignment = {
  workerId: bigint;
  workDate: Date;
  startsAt: Date;
  endsAt: Date;
  workerNameSnapshot: string;
  employeeCodeSnapshot: string;
};

type RecommendationCandidate = RecommendationAssignment;

type RecommendationShortage = {
  workDate: Date;
  dayOfWeek: DayOfWeek;
  startTime: Date;
  endTime: Date;
  endsNextDay: boolean;
  requiredCount: number;
  assignedCount: number;
};

type DemandWindow = {
  workDate: Date;
  dayOfWeek: DayOfWeek;
  startMinutes: number;
  endMinutes: number;
  startsAt: Date;
  endsAt: Date;
  startTime: Date;
  endTime: Date;
  endsNextDay: boolean;
  requiredCount: number;
};

const MINUTES_IN_DAY = 24 * 60;

const compareBigInt = (left: bigint, right: bigint) => (left < right ? -1 : left > right ? 1 : 0);

const hasOverlap = (
  assignments: RecommendationAssignment[],
  workerId: bigint,
  startsAt: Date,
  endsAt: Date,
) =>
  assignments.some(
    (assignment) =>
      assignment.workerId === workerId &&
      assignment.startsAt < endsAt &&
      startsAt < assignment.endsAt,
  );

const mergeAdjacentAssignments = (assignments: RecommendationAssignment[]) => {
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.workerId !== b.workerId) {
      return Number(a.workerId - b.workerId);
    }

    if (a.workDate.getTime() !== b.workDate.getTime()) {
      return a.workDate.getTime() - b.workDate.getTime();
    }

    return a.startsAt.getTime() - b.startsAt.getTime();
  });
  const mergedAssignments: RecommendationAssignment[] = [];

  for (const assignment of sortedAssignments) {
    const previous = mergedAssignments.at(-1);

    if (
      previous &&
      previous.workerId === assignment.workerId &&
      previous.workDate.getTime() === assignment.workDate.getTime() &&
      previous.endsAt.getTime() === assignment.startsAt.getTime()
    ) {
      previous.endsAt = assignment.endsAt;
      continue;
    }

    mergedAssignments.push({ ...assignment });
  }

  return mergedAssignments.sort((a, b) => {
    if (a.workDate.getTime() !== b.workDate.getTime()) {
      return a.workDate.getTime() - b.workDate.getTime();
    }

    if (a.startsAt.getTime() !== b.startsAt.getTime()) {
      return a.startsAt.getTime() - b.startsAt.getTime();
    }

    return Number(a.workerId - b.workerId);
  });
};

const getAssignmentDurationMinutes = (
  assignment: Pick<RecommendationAssignment, "endsAt" | "startsAt">,
) => Math.round((assignment.endsAt.getTime() - assignment.startsAt.getTime()) / 60000);

const getWeekStartDate = (date: Date) => {
  const day = date.getUTCDay();
  const mondayFirstOffset = day === 0 ? -6 : 1 - day;

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + mondayFirstOffset),
  );
};

const getAssignedMinutes = (
  assignments: RecommendationAssignment[],
  workerId: bigint,
  predicate: (assignment: RecommendationAssignment) => boolean,
) =>
  assignments
    .filter((assignment) => assignment.workerId === workerId && predicate(assignment))
    .reduce((total, assignment) => total + getAssignmentDurationMinutes(assignment), 0);

const dateTimeToMinutesFromWorkDate = (workDate: Date, dateTime: Date) =>
  Math.round((dateTime.getTime() - workDate.getTime()) / 60000);

const compareCandidatesByBalance = ({
  assignments,
  firstWorker,
  secondWorker,
  workDate,
}: {
  assignments: RecommendationAssignment[];
  firstWorker: Worker;
  secondWorker: Worker;
  workDate: Date;
}) => {
  const weekStartDate = getWeekStartDate(workDate);
  const weekEndDate = new Date(
    Date.UTC(
      weekStartDate.getUTCFullYear(),
      weekStartDate.getUTCMonth(),
      weekStartDate.getUTCDate() + 7,
    ),
  );
  const isSameWeek = (assignment: RecommendationAssignment) =>
    assignment.workDate >= weekStartDate && assignment.workDate < weekEndDate;
  const isSameDay = (assignment: RecommendationAssignment) =>
    assignment.workDate.getTime() === workDate.getTime();
  const firstWeeklyMinutes = getAssignedMinutes(assignments, firstWorker.id, isSameWeek);
  const secondWeeklyMinutes = getAssignedMinutes(assignments, secondWorker.id, isSameWeek);
  const firstContractMinutes = firstWorker.weeklyContractHours * 60;
  const secondContractMinutes = secondWorker.weeklyContractHours * 60;
  const firstUsage = firstWeeklyMinutes / firstContractMinutes;
  const secondUsage = secondWeeklyMinutes / secondContractMinutes;
  const allCandidatesOverContract = firstUsage >= 1 && secondUsage >= 1;

  if (allCandidatesOverContract) {
    const firstOverage = Math.max(0, firstWeeklyMinutes - firstContractMinutes);
    const secondOverage = Math.max(0, secondWeeklyMinutes - secondContractMinutes);

    if (firstOverage !== secondOverage) {
      return firstOverage - secondOverage;
    }
  }

  if (firstUsage !== secondUsage) {
    return firstUsage - secondUsage;
  }

  const firstDailyMinutes = getAssignedMinutes(assignments, firstWorker.id, isSameDay);
  const secondDailyMinutes = getAssignedMinutes(assignments, secondWorker.id, isSameDay);

  if (firstDailyMinutes !== secondDailyMinutes) {
    return firstDailyMinutes - secondDailyMinutes;
  }

  return firstWorker.employeeCode.localeCompare(secondWorker.employeeCode);
};

const createDemandWindowsForDate = ({
  availableTimes,
  businessHours,
  rules,
  workDate,
}: {
  availableTimes: WorkerAvailableTime[];
  businessHours: OrganizationBusinessHour[];
  rules: MinimumStaffingRule[];
  workDate: Date;
}): DemandWindow[] => {
  const dayOfWeek = getDayOfWeek(workDate);
  const demandSources = getSchedulableRangesForDate({
    businessHours,
    rules,
    workDate,
  });

  const boundaries = [
    ...new Set([
      ...demandSources.flatMap((source) => [source.startMinutes, source.endMinutes]),
      ...availableTimes
        .filter((availableTime) => availableTime.availableDate.getTime() === workDate.getTime())
        .flatMap((availableTime) => {
          const startMinutes = dateTimeToMinutesFromWorkDate(workDate, availableTime.startsAt);
          const endMinutes = dateTimeToMinutesFromWorkDate(workDate, availableTime.endsAt);

          return demandSources.flatMap((source) => {
            if (source.startMinutes >= endMinutes || startMinutes >= source.endMinutes) {
              return [];
            }

            return [
              Math.max(startMinutes, source.startMinutes),
              Math.min(endMinutes, source.endMinutes),
            ];
          });
        }),
    ]),
  ]
    .filter((boundary) => Number.isFinite(boundary))
    .sort((a, b) => a - b);
  const demandWindows: DemandWindow[] = [];

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const startMinutes = boundaries[index];
    const endMinutes = boundaries[index + 1];
    const activeDemandSources = demandSources.filter(
      (source) => source.startMinutes < endMinutes && startMinutes < source.endMinutes,
    );

    if (activeDemandSources.length === 0) {
      continue;
    }

    const requiredCount = Math.max(...activeDemandSources.map((source) => source.requiredCount));
    const startsAt = createDateTimeFromMinutes(workDate, startMinutes);
    const endsAt = createDateTimeFromMinutes(workDate, endMinutes);

    demandWindows.push({
      dayOfWeek,
      endMinutes,
      endsAt,
      endsNextDay: endMinutes >= MINUTES_IN_DAY,
      endTime: minutesToTimeDate(endMinutes),
      requiredCount,
      startMinutes,
      startsAt,
      startTime: minutesToTimeDate(startMinutes),
      workDate,
    });
  }

  return demandWindows;
};

export const createInputHash = ({
  availableTimes,
  businessHours,
  endDate,
  rules,
  startDate,
  workers,
}: {
  availableTimes: WorkerAvailableTime[];
  businessHours: OrganizationBusinessHour[];
  endDate: Date;
  rules: MinimumStaffingRule[];
  startDate: Date;
  workers: Worker[];
}) => {
  const payload = {
    startDate: dateToDateString(startDate),
    endDate: dateToDateString(endDate),
    workers: [...workers]
      .sort((left, right) => compareBigInt(left.id, right.id))
      .map((worker) => ({
        id: toApiId(worker.id),
        employeeCode: worker.employeeCode,
        name: worker.name,
        weeklyContractHours: worker.weeklyContractHours,
      })),
    availableTimes: [...availableTimes]
      .sort(
        (left, right) =>
          compareBigInt(left.workerId, right.workerId) ||
          left.availableDate.getTime() - right.availableDate.getTime() ||
          left.startsAt.getTime() - right.startsAt.getTime() ||
          left.endsAt.getTime() - right.endsAt.getTime(),
      )
      .map((availableTime) => ({
        workerId: toApiId(availableTime.workerId),
        availableDate: dateToDateString(availableTime.availableDate),
        startsAt: availableTime.startsAt.toISOString(),
        endsAt: availableTime.endsAt.toISOString(),
      })),
    businessHours: [...businessHours]
      .sort((left, right) => left.dayOfWeek.localeCompare(right.dayOfWeek))
      .map((businessHour) => ({
        dayOfWeek: businessHour.dayOfWeek,
        isClosed: businessHour.isClosed,
        openTime: businessHour.openTime ? dateToTimeString(businessHour.openTime) : null,
        closeTime: businessHour.closeTime ? dateToTimeString(businessHour.closeTime) : null,
        closesNextDay: businessHour.closesNextDay,
      })),
    rules: [...rules]
      .sort(
        (left, right) =>
          left.dayOfWeek.localeCompare(right.dayOfWeek) ||
          left.startTime.getTime() - right.startTime.getTime() ||
          left.endTime.getTime() - right.endTime.getTime() ||
          Number(left.endsNextDay) - Number(right.endsNextDay) ||
          left.requiredCount - right.requiredCount,
      )
      .map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startTime: dateToTimeString(rule.startTime),
        endTime: dateToTimeString(rule.endTime),
        endsNextDay: rule.endsNextDay,
        requiredCount: rule.requiredCount,
      })),
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
};

export const createRecommendations = ({
  availableTimes,
  businessHours,
  endDate,
  rules,
  startDate,
  workers,
}: {
  availableTimes: WorkerAvailableTime[];
  businessHours: OrganizationBusinessHour[];
  endDate: Date;
  rules: MinimumStaffingRule[];
  startDate: Date;
  workers: Worker[];
}): {
  assignments: RecommendationAssignment[];
  candidates: RecommendationCandidate[];
  shortages: RecommendationShortage[];
} => {
  const assignments: RecommendationAssignment[] = [];
  const candidates: RecommendationCandidate[] = [];
  const shortages: RecommendationShortage[] = [];

  for (const workDate of eachDateInRange(startDate, endDate)) {
    const demandWindows = createDemandWindowsForDate({
      availableTimes,
      businessHours,
      rules,
      workDate,
    });

    for (const demandWindow of demandWindows) {
      const availableCandidates = workers
        .filter((worker) =>
          availableTimes.some(
            (availableTime) =>
              availableTime.workerId === worker.id &&
              availableTime.availableDate.getTime() === workDate.getTime() &&
              availableTime.startsAt <= demandWindow.startsAt &&
              availableTime.endsAt >= demandWindow.endsAt,
          ),
        )
        .sort((firstWorker, secondWorker) =>
          firstWorker.employeeCode.localeCompare(secondWorker.employeeCode),
        );
      const selectableCandidates = availableCandidates
        .filter(
          (worker) =>
            !hasOverlap(assignments, worker.id, demandWindow.startsAt, demandWindow.endsAt),
        )
        .sort((firstWorker, secondWorker) =>
          compareCandidatesByBalance({
            assignments,
            firstWorker,
            secondWorker,
            workDate,
          }),
        );
      const selectedWorkers = selectableCandidates.slice(0, demandWindow.requiredCount);

      candidates.push(
        ...availableCandidates.map((worker) => ({
          workerId: worker.id,
          workDate,
          startsAt: demandWindow.startsAt,
          endsAt: demandWindow.endsAt,
          workerNameSnapshot: worker.name,
          employeeCodeSnapshot: worker.employeeCode,
        })),
      );

      assignments.push(
        ...selectedWorkers.map((worker) => ({
          workerId: worker.id,
          workDate,
          startsAt: demandWindow.startsAt,
          endsAt: demandWindow.endsAt,
          workerNameSnapshot: worker.name,
          employeeCodeSnapshot: worker.employeeCode,
        })),
      );

      if (selectedWorkers.length < demandWindow.requiredCount) {
        shortages.push({
          workDate,
          dayOfWeek: demandWindow.dayOfWeek,
          startTime: demandWindow.startTime,
          endTime: demandWindow.endTime,
          endsNextDay: demandWindow.endsNextDay,
          requiredCount: demandWindow.requiredCount,
          assignedCount: selectedWorkers.length,
        });
      }
    }
  }

  return { assignments: mergeAdjacentAssignments(assignments), candidates, shortages };
};
