import type { Prisma, PrismaClient, Schedule } from "@fragment/database";
import type {
  DraftScheduleQuery,
  DraftScheduleResponse,
  RecommendScheduleRequest,
  ScheduleAssignment,
  ScheduleAssignmentInput,
  ScheduleDetail,
  UpdateScheduleAssignmentRequest,
} from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { dateStringToDate, dateTimeStringToDate } from "@/utils/date-time";
import { toPrismaId } from "@/utils/mapper";
import { scheduleDetailInclude, toScheduleAssignment, toScheduleDetail } from "./schedules.mapper";
import { createInputHash, createRecommendations } from "./schedules.recommendation";

type SchedulesDatabaseClient = PrismaClient | Prisma.TransactionClient;

const createScheduleNotFoundError = () =>
  new HttpError(404, ERROR_CODES.SCHEDULE_NOT_FOUND, "스케줄을 찾을 수 없습니다.");

const createDraftRequiredError = () =>
  new HttpError(409, ERROR_CODES.CONFLICT, "DRAFT 상태의 스케줄만 변경할 수 있습니다.");

const createValidationError = (message = "요청 형식이 올바르지 않습니다.") =>
  new HttpError(400, ERROR_CODES.VALIDATION_ERROR, message);

const assertDateRangeInSchedule = (
  schedule: Pick<Schedule, "startDate" | "endDate">,
  date: Date,
) => {
  if (date < schedule.startDate || date > schedule.endDate) {
    throw createValidationError("근무 날짜가 스케줄 기간을 벗어났습니다.");
  }
};

const findDraftSchedule = async (
  client: SchedulesDatabaseClient,
  organizationId: bigint,
  scheduleId: bigint,
) => {
  const schedule = await client.schedule.findFirst({
    where: {
      id: scheduleId,
      organizationId,
    },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!schedule) {
    throw createScheduleNotFoundError();
  }

  if (schedule.status !== "DRAFT") {
    throw createDraftRequiredError();
  }

  return schedule;
};

const findWorkerByOrganization = async (
  client: SchedulesDatabaseClient,
  organizationId: bigint,
  workerId: bigint,
) => {
  const worker = await client.worker.findFirst({
    where: {
      id: workerId,
      organizationId,
    },
    select: {
      id: true,
      employeeCode: true,
      name: true,
    },
  });

  if (!worker) {
    throw new HttpError(404, ERROR_CODES.WORKER_NOT_FOUND, "근무자를 찾을 수 없습니다.");
  }

  return worker;
};

export async function recommendSchedule(
  prisma: PrismaClient,
  organizationId: string,
  input: RecommendScheduleRequest,
): Promise<ScheduleDetail> {
  const organizationDatabaseId = toPrismaId(organizationId);
  const startDate = dateStringToDate(input.startDate);
  const endDate = dateStringToDate(input.endDate);
  const activePeriod = await prisma.activeSchedulePlanningPeriod.findUnique({
    where: {
      organizationId: organizationDatabaseId,
    },
  });

  if (!activePeriod) {
    throw new HttpError(
      400,
      ERROR_CODES.NO_ACTIVE_PLANNING_PERIOD,
      "활성 스케줄 계획 기간이 없습니다.",
    );
  }

  if (
    activePeriod.startDate.getTime() !== startDate.getTime() ||
    activePeriod.endDate.getTime() !== endDate.getTime()
  ) {
    throw createValidationError("활성 스케줄 계획 기간과 요청 기간이 일치해야 합니다.");
  }

  const [workers, availableTimes, rules] = await Promise.all([
    prisma.worker.findMany({
      where: {
        organizationId: organizationDatabaseId,
      },
      orderBy: {
        employeeCode: "asc",
      },
    }),
    prisma.workerAvailableTime.findMany({
      where: {
        worker: {
          organizationId: organizationDatabaseId,
        },
        availableDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ availableDate: "asc" }, { startsAt: "asc" }],
    }),
    prisma.minimumStaffingRule.findMany({
      where: {
        organizationId: organizationDatabaseId,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  if (workers.length === 0 || availableTimes.length === 0 || rules.length === 0) {
    throw createValidationError(
      "스케줄 추천에 필요한 근무자, 가능 시간, 최소 인원 조건이 부족합니다.",
    );
  }

  const inputHash = createInputHash({
    availableTimes,
    endDate,
    rules,
    startDate,
    workers,
  });
  const existingDraft = await prisma.schedule.findFirst({
    where: {
      organizationId: organizationDatabaseId,
      inputHash,
      status: "DRAFT",
    },
    select: {
      id: true,
    },
  });

  if (existingDraft) {
    throw new HttpError(409, ERROR_CODES.DRAFT_ALREADY_EXISTS, "이미 생성된 DRAFT 스케줄입니다.");
  }

  const { assignments, shortages } = createRecommendations({
    availableTimes,
    endDate,
    rules,
    startDate,
    workers,
  });

  const schedule = await prisma.schedule.create({
    data: {
      organization: {
        connect: {
          id: organizationDatabaseId,
        },
      },
      status: "DRAFT",
      inputHash,
      startDate,
      endDate,
      assignments: {
        create: assignments.map((assignment) => ({
          worker: {
            connect: {
              id: assignment.workerId,
            },
          },
          workDate: assignment.workDate,
          startsAt: assignment.startsAt,
          endsAt: assignment.endsAt,
          workerNameSnapshot: assignment.workerNameSnapshot,
          employeeCodeSnapshot: assignment.employeeCodeSnapshot,
        })),
      },
      workerShortages: {
        create: shortages,
      },
    },
    include: scheduleDetailInclude,
  });

  return toScheduleDetail(schedule);
}

export async function getDraftSchedule(
  prisma: PrismaClient,
  organizationId: string,
  query: DraftScheduleQuery,
): Promise<DraftScheduleResponse> {
  const schedule = await prisma.schedule.findFirst({
    where: {
      organizationId: toPrismaId(organizationId),
      status: "DRAFT",
      startDate: dateStringToDate(query.startDate),
      endDate: dateStringToDate(query.endDate),
    },
    include: scheduleDetailInclude,
  });

  return {
    schedule: schedule ? toScheduleDetail(schedule) : null,
  };
}

export async function createScheduleAssignment(
  prisma: PrismaClient,
  organizationId: string,
  scheduleId: string,
  input: ScheduleAssignmentInput,
): Promise<ScheduleAssignment> {
  const organizationDatabaseId = toPrismaId(organizationId);
  const scheduleDatabaseId = toPrismaId(scheduleId);

  return prisma.$transaction(async (transaction) => {
    const schedule = await findDraftSchedule(
      transaction,
      organizationDatabaseId,
      scheduleDatabaseId,
    );
    const workDate = dateStringToDate(input.workDate);

    assertDateRangeInSchedule(schedule, workDate);

    const worker = await findWorkerByOrganization(
      transaction,
      organizationDatabaseId,
      toPrismaId(input.workerId),
    );
    const assignment = await transaction.scheduleAssignment.create({
      data: {
        scheduleId: schedule.id,
        workerId: worker.id,
        workDate,
        startsAt: dateTimeStringToDate(input.startsAt),
        endsAt: dateTimeStringToDate(input.endsAt),
        workerNameSnapshot: worker.name,
        employeeCodeSnapshot: worker.employeeCode,
      },
    });

    return toScheduleAssignment(assignment);
  });
}

export async function updateScheduleAssignment(
  prisma: PrismaClient,
  organizationId: string,
  scheduleId: string,
  assignmentId: string,
  input: UpdateScheduleAssignmentRequest,
): Promise<ScheduleAssignment> {
  const organizationDatabaseId = toPrismaId(organizationId);
  const scheduleDatabaseId = toPrismaId(scheduleId);
  const assignmentDatabaseId = toPrismaId(assignmentId);

  return prisma.$transaction(async (transaction) => {
    const schedule = await findDraftSchedule(
      transaction,
      organizationDatabaseId,
      scheduleDatabaseId,
    );
    const existingAssignment = await transaction.scheduleAssignment.findFirst({
      where: {
        id: assignmentDatabaseId,
        scheduleId: schedule.id,
      },
    });

    if (!existingAssignment) {
      throw createScheduleNotFoundError();
    }

    const workDate =
      input.workDate !== undefined ? dateStringToDate(input.workDate) : existingAssignment.workDate;
    const startsAt =
      input.startsAt !== undefined
        ? dateTimeStringToDate(input.startsAt)
        : existingAssignment.startsAt;
    const endsAt =
      input.endsAt !== undefined ? dateTimeStringToDate(input.endsAt) : existingAssignment.endsAt;

    if (startsAt >= endsAt) {
      throw createValidationError("종료 시각은 시작 시각보다 늦어야 합니다.");
    }

    assertDateRangeInSchedule(schedule, workDate);

    const worker =
      input.workerId !== undefined
        ? await findWorkerByOrganization(
            transaction,
            organizationDatabaseId,
            toPrismaId(input.workerId),
          )
        : null;
    const updatedAssignment = await transaction.scheduleAssignment.update({
      where: {
        id: existingAssignment.id,
      },
      data: {
        ...(input.workerId !== undefined && worker
          ? {
              workerId: worker.id,
              workerNameSnapshot: worker.name,
              employeeCodeSnapshot: worker.employeeCode,
            }
          : {}),
        ...(input.workDate !== undefined ? { workDate } : {}),
        ...(input.startsAt !== undefined ? { startsAt } : {}),
        ...(input.endsAt !== undefined ? { endsAt } : {}),
      },
    });

    return toScheduleAssignment(updatedAssignment);
  });
}

export async function deleteScheduleAssignment(
  prisma: PrismaClient,
  organizationId: string,
  scheduleId: string,
  assignmentId: string,
): Promise<void> {
  const organizationDatabaseId = toPrismaId(organizationId);
  const scheduleDatabaseId = toPrismaId(scheduleId);
  const assignmentDatabaseId = toPrismaId(assignmentId);

  await prisma.$transaction(async (transaction) => {
    const schedule = await findDraftSchedule(
      transaction,
      organizationDatabaseId,
      scheduleDatabaseId,
    );
    const result = await transaction.scheduleAssignment.deleteMany({
      where: {
        id: assignmentDatabaseId,
        scheduleId: schedule.id,
      },
    });

    if (result.count === 0) {
      throw createScheduleNotFoundError();
    }
  });
}

export async function confirmSchedule(
  prisma: PrismaClient,
  organizationId: string,
  scheduleId: string,
): Promise<ScheduleDetail> {
  const organizationDatabaseId = toPrismaId(organizationId);
  const scheduleDatabaseId = toPrismaId(scheduleId);

  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleDatabaseId,
      organizationId: organizationDatabaseId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!schedule) {
    throw createScheduleNotFoundError();
  }

  if (schedule.status !== "DRAFT") {
    throw createDraftRequiredError();
  }

  const updatedSchedule = await prisma.schedule.update({
    where: {
      id: schedule.id,
    },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
    include: scheduleDetailInclude,
  });

  return toScheduleDetail(updatedSchedule);
}
