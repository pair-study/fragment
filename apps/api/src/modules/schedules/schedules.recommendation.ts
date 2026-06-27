import { createHash } from "node:crypto";
import type {
  DayOfWeek,
  MinimumStaffingRule,
  Worker,
  WorkerAvailableTime,
} from "@fragment/database";

import {
  addDays,
  createDateTimeOnDate,
  dateToDateString,
  dateToTimeString,
} from "@/utils/date-time";
import { eachDateInRange } from "@/utils/date-range";
import { getDayOfWeek } from "@/utils/day-of-week";
import { toApiId } from "@/utils/mapper";

type RecommendationAssignment = {
  workerId: bigint;
  workDate: Date;
  startsAt: Date;
  endsAt: Date;
  workerNameSnapshot: string;
  employeeCodeSnapshot: string;
};

type RecommendationShortage = {
  workDate: Date;
  dayOfWeek: DayOfWeek;
  startTime: Date;
  endTime: Date;
  endsNextDay: boolean;
  requiredCount: number;
  assignedCount: number;
};

const createScheduleDateTimeOnDate = (date: Date, time: Date, addDay = false) => {
  const targetDate = addDay ? addDays(date, 1) : date;

  return createDateTimeOnDate(targetDate, time);
};

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

export const createInputHash = ({
  availableTimes,
  endDate,
  rules,
  startDate,
  workers,
}: {
  availableTimes: WorkerAvailableTime[];
  endDate: Date;
  rules: MinimumStaffingRule[];
  startDate: Date;
  workers: Worker[];
}) => {
  const payload = {
    startDate: dateToDateString(startDate),
    endDate: dateToDateString(endDate),
    workers: workers.map((worker) => ({
      id: toApiId(worker.id),
      employeeCode: worker.employeeCode,
      name: worker.name,
      weeklyContractHours: worker.weeklyContractHours,
    })),
    availableTimes: availableTimes.map((availableTime) => ({
      workerId: toApiId(availableTime.workerId),
      availableDate: dateToDateString(availableTime.availableDate),
      startsAt: availableTime.startsAt.toISOString(),
      endsAt: availableTime.endsAt.toISOString(),
    })),
    rules: rules.map((rule) => ({
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
  endDate,
  rules,
  startDate,
  workers,
}: {
  availableTimes: WorkerAvailableTime[];
  endDate: Date;
  rules: MinimumStaffingRule[];
  startDate: Date;
  workers: Worker[];
}): {
  assignments: RecommendationAssignment[];
  shortages: RecommendationShortage[];
} => {
  const assignments: RecommendationAssignment[] = [];
  const shortages: RecommendationShortage[] = [];

  for (const workDate of eachDateInRange(startDate, endDate)) {
    const dayOfWeek = getDayOfWeek(workDate);
    const dayRules = rules.filter((rule) => rule.dayOfWeek === dayOfWeek);

    for (const rule of dayRules) {
      const startsAt = createScheduleDateTimeOnDate(workDate, rule.startTime);
      const endsAt = createScheduleDateTimeOnDate(workDate, rule.endTime, rule.endsNextDay);
      const candidates = workers.filter((worker) =>
        availableTimes.some(
          (availableTime) =>
            availableTime.workerId === worker.id &&
            availableTime.availableDate.getTime() === workDate.getTime() &&
            availableTime.startsAt <= startsAt &&
            availableTime.endsAt >= endsAt &&
            !hasOverlap(assignments, worker.id, startsAt, endsAt),
        ),
      );
      const selectedWorkers = candidates.slice(0, rule.requiredCount);

      assignments.push(
        ...selectedWorkers.map((worker) => ({
          workerId: worker.id,
          workDate,
          startsAt,
          endsAt,
          workerNameSnapshot: worker.name,
          employeeCodeSnapshot: worker.employeeCode,
        })),
      );

      if (selectedWorkers.length < rule.requiredCount) {
        shortages.push({
          workDate,
          dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          endsNextDay: rule.endsNextDay,
          requiredCount: rule.requiredCount,
          assignedCount: selectedWorkers.length,
        });
      }
    }
  }

  return { assignments, shortages };
};
