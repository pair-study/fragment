import type {
  Prisma,
  Schedule,
  ScheduleAssignment as PrismaScheduleAssignment,
  ScheduleCandidate as PrismaScheduleCandidate,
  ScheduleWorkerShortage as PrismaScheduleWorkerShortage,
} from "@fragment/database";
import type {
  ScheduleAssignment,
  ScheduleCandidate,
  ScheduleDetail,
  ScheduleWorkerShortage,
} from "@fragment/shared";

import { dateToDateString, dateToTimeString } from "@/utils/date-time";
import { toApiId } from "@/utils/mapper";

type ScheduleWithDetails = Schedule & {
  assignments: PrismaScheduleAssignment[];
  candidates: PrismaScheduleCandidate[];
  workerShortages: PrismaScheduleWorkerShortage[];
};

export const scheduleDetailInclude = {
  assignments: {
    orderBy: [{ workDate: "asc" }, { startsAt: "asc" }, { id: "asc" }],
  },
  candidates: {
    orderBy: [{ workDate: "asc" }, { startsAt: "asc" }, { employeeCodeSnapshot: "asc" }],
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

const isCandidateRecommended = (
  candidate: PrismaScheduleCandidate,
  assignments: PrismaScheduleAssignment[],
) =>
  assignments.some(
    (assignment) =>
      assignment.workDate.getTime() === candidate.workDate.getTime() &&
      assignment.startsAt.getTime() === candidate.startsAt.getTime() &&
      assignment.endsAt.getTime() === candidate.endsAt.getTime() &&
      (candidate.workerId !== null
        ? assignment.workerId === candidate.workerId
        : assignment.workerId === null &&
          assignment.workerNameSnapshot === candidate.workerNameSnapshot &&
          assignment.employeeCodeSnapshot === candidate.employeeCodeSnapshot),
  );

export const toScheduleCandidate = (
  candidate: PrismaScheduleCandidate,
  assignments: PrismaScheduleAssignment[],
): ScheduleCandidate => ({
  id: toApiId(candidate.id),
  scheduleId: toApiId(candidate.scheduleId),
  workerId: candidate.workerId === null ? null : toApiId(candidate.workerId),
  workDate: dateToDateString(candidate.workDate),
  startsAt: candidate.startsAt.toISOString(),
  endsAt: candidate.endsAt.toISOString(),
  workerNameSnapshot: candidate.workerNameSnapshot,
  employeeCodeSnapshot: candidate.employeeCodeSnapshot,
  isRecommended: isCandidateRecommended(candidate, assignments),
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
  candidates: schedule.candidates.map((candidate) =>
    toScheduleCandidate(candidate, schedule.assignments),
  ),
  workerShortages: schedule.workerShortages.map(toScheduleWorkerShortage),
});
