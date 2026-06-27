import type {
  Prisma,
  Schedule,
  ScheduleAssignment as PrismaScheduleAssignment,
  ScheduleWorkerShortage as PrismaScheduleWorkerShortage,
} from "@fragment/database";
import type { ScheduleAssignment, ScheduleDetail, ScheduleWorkerShortage } from "@fragment/shared";

import { dateToDateString, dateToTimeString } from "@/utils/date-time";
import { toApiId } from "@/utils/mapper";

type ScheduleWithDetails = Schedule & {
  assignments: PrismaScheduleAssignment[];
  workerShortages: PrismaScheduleWorkerShortage[];
};

export const scheduleDetailInclude = {
  assignments: {
    orderBy: [{ workDate: "asc" }, { startsAt: "asc" }, { id: "asc" }],
  },
  workerShortages: {
    orderBy: [{ workDate: "asc" }, { startTime: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.ScheduleInclude;

export const toScheduleAssignment = (assignment: PrismaScheduleAssignment): ScheduleAssignment => ({
  id: toApiId(assignment.id),
  scheduleId: toApiId(assignment.scheduleId),
  workerId: assignment.workerId === null ? null : toApiId(assignment.workerId),
  workDate: dateToDateString(assignment.workDate),
  startsAt: assignment.startsAt.toISOString(),
  endsAt: assignment.endsAt.toISOString(),
  workerNameSnapshot: assignment.workerNameSnapshot,
  employeeCodeSnapshot: assignment.employeeCodeSnapshot,
});

export const toScheduleWorkerShortage = (
  shortage: PrismaScheduleWorkerShortage,
): ScheduleWorkerShortage => ({
  id: toApiId(shortage.id),
  scheduleId: toApiId(shortage.scheduleId),
  workDate: dateToDateString(shortage.workDate),
  dayOfWeek: shortage.dayOfWeek,
  startTime: dateToTimeString(shortage.startTime),
  endTime: dateToTimeString(shortage.endTime),
  endsNextDay: shortage.endsNextDay,
  requiredCount: shortage.requiredCount,
  assignedCount: shortage.assignedCount,
});

export const toScheduleDetail = (schedule: ScheduleWithDetails): ScheduleDetail => ({
  id: toApiId(schedule.id),
  status: schedule.status,
  startDate: dateToDateString(schedule.startDate),
  endDate: dateToDateString(schedule.endDate),
  generatedAt: schedule.generatedAt.toISOString(),
  confirmedAt: schedule.confirmedAt ? schedule.confirmedAt.toISOString() : null,
  assignments: schedule.assignments.map(toScheduleAssignment),
  workerShortages: schedule.workerShortages.map(toScheduleWorkerShortage),
});
