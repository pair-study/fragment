import type { PrismaClient } from "@fragment/database";
import { DAY_OF_WEEK_VALUES } from "@fragment/shared";

type FakeUser = {
  id: bigint;
  email: string;
  name: string;
  passwordHash: string;
};

type FakeBusinessHour = {
  id: bigint;
  organizationId: bigint;
  dayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  isClosed: boolean;
  openTime: Date | null;
  closeTime: Date | null;
  closesNextDay: boolean;
};

type FakeOrganization = {
  id: bigint;
  userId: bigint;
  name: string;
  businessHours: FakeBusinessHour[];
};

type FakeActiveSchedulePlanningPeriod = {
  id: bigint;
  organizationId: bigint;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

type FakeMinimumStaffingRule = {
  id: bigint;
  organizationId: bigint;
  dayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  startTime: Date;
  endTime: Date;
  endsNextDay: boolean;
  requiredCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type FakeWorkerAvailableTime = {
  id: bigint;
  workerId: bigint;
  availableDate: Date;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type FakeSchedule = {
  id: bigint;
  organizationId: bigint;
  status: "DRAFT" | "CONFIRMED";
  inputHash: string;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type FakeScheduleAssignment = {
  id: bigint;
  scheduleId: bigint;
  workerId: bigint | null;
  workDate: Date;
  startsAt: Date;
  endsAt: Date;
  workerNameSnapshot: string;
  employeeCodeSnapshot: string;
  createdAt: Date;
  updatedAt: Date;
};

type FakeScheduleCandidate = {
  id: bigint;
  scheduleId: bigint;
  workerId: bigint | null;
  workDate: Date;
  startsAt: Date;
  endsAt: Date;
  workerNameSnapshot: string;
  employeeCodeSnapshot: string;
  createdAt: Date;
  updatedAt: Date;
};

type FakeScheduleWorkerShortage = {
  id: bigint;
  scheduleId: bigint;
  workDate: Date;
  dayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  startTime: Date;
  endTime: Date;
  endsNextDay: boolean;
  requiredCount: number;
  assignedCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type FakeRefreshToken = {
  id: bigint;
  userId: bigint;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

type FakeWorker = {
  id: bigint;
  organizationId: bigint;
  employeeCode: string;
  name: string;
  weeklyContractHours: number;
};

type CreateFakePrismaOptions = {
  activeSchedulePlanningPeriods?: FakeActiveSchedulePlanningPeriod[];
  availableTimes?: FakeWorkerAvailableTime[];
  minimumStaffingRules?: FakeMinimumStaffingRule[];
  organizations?: FakeOrganization[];
  refreshTokens?: FakeRefreshToken[];
  scheduleAssignments?: FakeScheduleAssignment[];
  scheduleCandidates?: FakeScheduleCandidate[];
  scheduleWorkerShortages?: FakeScheduleWorkerShortage[];
  schedules?: FakeSchedule[];
  users?: FakeUser[];
  workers?: FakeWorker[];
};

const cloneDate = (date: Date | null) => (date ? new Date(date.getTime()) : null);
const cloneRequiredDate = (date: Date) => new Date(date.getTime());

const cloneBusinessHour = (businessHour: FakeBusinessHour): FakeBusinessHour => ({
  ...businessHour,
  closeTime: cloneDate(businessHour.closeTime),
  openTime: cloneDate(businessHour.openTime),
});

const cloneActiveSchedulePlanningPeriod = (
  period: FakeActiveSchedulePlanningPeriod,
): FakeActiveSchedulePlanningPeriod => ({
  ...period,
  createdAt: cloneRequiredDate(period.createdAt),
  endDate: cloneRequiredDate(period.endDate),
  startDate: cloneRequiredDate(period.startDate),
  updatedAt: cloneRequiredDate(period.updatedAt),
});

const cloneMinimumStaffingRule = (
  minimumStaffingRule: FakeMinimumStaffingRule,
): FakeMinimumStaffingRule => ({
  ...minimumStaffingRule,
  createdAt: cloneRequiredDate(minimumStaffingRule.createdAt),
  endTime: cloneRequiredDate(minimumStaffingRule.endTime),
  startTime: cloneRequiredDate(minimumStaffingRule.startTime),
  updatedAt: cloneRequiredDate(minimumStaffingRule.updatedAt),
});

const cloneWorkerAvailableTime = (
  availableTime: FakeWorkerAvailableTime,
): FakeWorkerAvailableTime => ({
  ...availableTime,
  availableDate: cloneRequiredDate(availableTime.availableDate),
  createdAt: cloneRequiredDate(availableTime.createdAt),
  endsAt: cloneRequiredDate(availableTime.endsAt),
  startsAt: cloneRequiredDate(availableTime.startsAt),
  updatedAt: cloneRequiredDate(availableTime.updatedAt),
});

const cloneSchedule = (schedule: FakeSchedule): FakeSchedule => ({
  ...schedule,
  confirmedAt: cloneDate(schedule.confirmedAt),
  createdAt: cloneRequiredDate(schedule.createdAt),
  endDate: cloneRequiredDate(schedule.endDate),
  generatedAt: cloneRequiredDate(schedule.generatedAt),
  startDate: cloneRequiredDate(schedule.startDate),
  updatedAt: cloneRequiredDate(schedule.updatedAt),
});

const cloneScheduleAssignment = (assignment: FakeScheduleAssignment): FakeScheduleAssignment => ({
  ...assignment,
  createdAt: cloneRequiredDate(assignment.createdAt),
  endsAt: cloneRequiredDate(assignment.endsAt),
  startsAt: cloneRequiredDate(assignment.startsAt),
  updatedAt: cloneRequiredDate(assignment.updatedAt),
  workDate: cloneRequiredDate(assignment.workDate),
});

const cloneScheduleCandidate = (candidate: FakeScheduleCandidate): FakeScheduleCandidate => ({
  ...candidate,
  createdAt: cloneRequiredDate(candidate.createdAt),
  endsAt: cloneRequiredDate(candidate.endsAt),
  startsAt: cloneRequiredDate(candidate.startsAt),
  updatedAt: cloneRequiredDate(candidate.updatedAt),
  workDate: cloneRequiredDate(candidate.workDate),
});

const cloneScheduleWorkerShortage = (
  shortage: FakeScheduleWorkerShortage,
): FakeScheduleWorkerShortage => ({
  ...shortage,
  createdAt: cloneRequiredDate(shortage.createdAt),
  endTime: cloneRequiredDate(shortage.endTime),
  startTime: cloneRequiredDate(shortage.startTime),
  updatedAt: cloneRequiredDate(shortage.updatedAt),
  workDate: cloneRequiredDate(shortage.workDate),
});

const getNextId = <T extends { id: bigint }>(items: T[]) =>
  items.reduce((nextId, item) => (item.id >= nextId ? item.id + BigInt(1) : nextId), BigInt(1));

const dayOfWeekOrder = Object.fromEntries(
  DAY_OF_WEEK_VALUES.map((dayOfWeek, index) => [dayOfWeek, index]),
) as Record<(typeof DAY_OF_WEEK_VALUES)[number], number>;

export function createFakePrisma({
  activeSchedulePlanningPeriods = [],
  availableTimes = [],
  minimumStaffingRules = [],
  organizations = [],
  refreshTokens = [],
  scheduleAssignments = [],
  scheduleCandidates = [],
  scheduleWorkerShortages = [],
  schedules = [],
  users = [],
  workers = [],
}: CreateFakePrismaOptions = {}) {
  const state = {
    nextBusinessHourId: getNextId(
      organizations.flatMap((organization) => organization.businessHours),
    ),
    nextOrganizationId: getNextId(organizations),
    nextAvailableTimeId: getNextId(availableTimes),
    nextPlanningPeriodId: getNextId(activeSchedulePlanningPeriods),
    nextRefreshTokenId: getNextId(refreshTokens),
    nextScheduleAssignmentId: getNextId(scheduleAssignments),
    nextScheduleCandidateId: getNextId(scheduleCandidates),
    nextScheduleId: getNextId(schedules),
    nextScheduleWorkerShortageId: getNextId(scheduleWorkerShortages),
    nextUserId: getNextId(users),
    activeSchedulePlanningPeriods: activeSchedulePlanningPeriods.map(
      cloneActiveSchedulePlanningPeriod,
    ),
    availableTimes: availableTimes.map(cloneWorkerAvailableTime),
    minimumStaffingRules: minimumStaffingRules.map(cloneMinimumStaffingRule),
    organizations: organizations.map((organization) => ({
      ...organization,
      businessHours: organization.businessHours.map(cloneBusinessHour),
    })),
    refreshTokens: refreshTokens.map((refreshToken) => ({ ...refreshToken })),
    scheduleAssignments: scheduleAssignments.map(cloneScheduleAssignment),
    scheduleCandidates: scheduleCandidates.map(cloneScheduleCandidate),
    scheduleWorkerShortages: scheduleWorkerShortages.map(cloneScheduleWorkerShortage),
    schedules: schedules.map(cloneSchedule),
    users: [...users],
    workers: workers.map((worker) => ({ ...worker })),
  };

  const findOrganizationByUserId = (userId: bigint) =>
    state.organizations.find((organization) => organization.userId === userId) ?? null;

  const findOrganizationById = (id: bigint) =>
    state.organizations.find((organization) => organization.id === id) ?? null;

  const toOrganizationResult = (organization: FakeOrganization | null, options?: any) => {
    if (!organization) {
      return null;
    }

    if (options?.select) {
      return Object.fromEntries(
        Object.keys(options.select)
          .filter((key) => options.select[key])
          .map((key) => [key, organization[key as keyof FakeOrganization]]),
      );
    }

    if (options?.include) {
      return {
        ...organization,
        ...(options.include.businessHours
          ? { businessHours: organization.businessHours.map(cloneBusinessHour) }
          : {}),
        ...(options.include.minimumStaffingRules
          ? {
              minimumStaffingRules: state.minimumStaffingRules
                .filter((rule) => rule.organizationId === organization.id)
                .map(cloneMinimumStaffingRule),
            }
          : {}),
      };
    }

    return {
      ...organization,
      businessHours: organization.businessHours.map(cloneBusinessHour),
    };
  };

  const toSelectedResult = <T extends Record<string, unknown>>(item: T, select: any) =>
    Object.fromEntries(
      Object.keys(select)
        .filter((key) => select[key])
        .map((key) => [key, item[key]]),
    );

  const sortScheduleAssignments = (assignments: FakeScheduleAssignment[]) =>
    assignments.sort((a, b) => {
      if (a.workDate.getTime() !== b.workDate.getTime()) {
        return a.workDate.getTime() - b.workDate.getTime();
      }

      if (a.startsAt.getTime() !== b.startsAt.getTime()) {
        return a.startsAt.getTime() - b.startsAt.getTime();
      }

      return Number(a.id - b.id);
    });

  const sortScheduleCandidates = (candidates: FakeScheduleCandidate[]) =>
    candidates.sort((a, b) => {
      if (a.workDate.getTime() !== b.workDate.getTime()) {
        return a.workDate.getTime() - b.workDate.getTime();
      }

      if (a.startsAt.getTime() !== b.startsAt.getTime()) {
        return a.startsAt.getTime() - b.startsAt.getTime();
      }

      return a.employeeCodeSnapshot.localeCompare(b.employeeCodeSnapshot);
    });

  const sortScheduleWorkerShortages = (shortages: FakeScheduleWorkerShortage[]) =>
    shortages.sort((a, b) => {
      if (a.workDate.getTime() !== b.workDate.getTime()) {
        return a.workDate.getTime() - b.workDate.getTime();
      }

      if (a.startTime.getTime() !== b.startTime.getTime()) {
        return a.startTime.getTime() - b.startTime.getTime();
      }

      return Number(a.id - b.id);
    });

  const toScheduleResult = (schedule: FakeSchedule | null, options?: any) => {
    if (!schedule) {
      return null;
    }

    const clonedSchedule = cloneSchedule(schedule);

    if (options?.select) {
      return toSelectedResult(clonedSchedule as unknown as Record<string, unknown>, options.select);
    }

    if (options?.include) {
      return {
        ...clonedSchedule,
        assignments: sortScheduleAssignments(
          state.scheduleAssignments
            .filter((assignment) => assignment.scheduleId === schedule.id)
            .map(cloneScheduleAssignment),
        ),
        candidates: sortScheduleCandidates(
          state.scheduleCandidates
            .filter((candidate) => candidate.scheduleId === schedule.id)
            .map(cloneScheduleCandidate),
        ),
        workerShortages: sortScheduleWorkerShortages(
          state.scheduleWorkerShortages
            .filter((shortage) => shortage.scheduleId === schedule.id)
            .map(cloneScheduleWorkerShortage),
        ),
      };
    }

    return clonedSchedule;
  };

  const matchesScheduleWhere = (schedule: FakeSchedule, where: any) => {
    if (where.id !== undefined && schedule.id !== where.id) {
      return false;
    }

    if (where.organizationId !== undefined && schedule.organizationId !== where.organizationId) {
      return false;
    }

    if (where.status !== undefined && schedule.status !== where.status) {
      return false;
    }

    if (where.inputHash !== undefined && schedule.inputHash !== where.inputHash) {
      return false;
    }

    if (
      where.startDate !== undefined &&
      schedule.startDate.getTime() !== where.startDate.getTime()
    ) {
      return false;
    }

    if (where.endDate !== undefined && schedule.endDate.getTime() !== where.endDate.getTime()) {
      return false;
    }

    return true;
  };

  const matchesScheduleAssignmentWhere = (assignment: FakeScheduleAssignment, where: any) => {
    if (where.id !== undefined && assignment.id !== where.id) {
      return false;
    }

    if (where.scheduleId !== undefined && assignment.scheduleId !== where.scheduleId) {
      return false;
    }

    return true;
  };

  const prisma = {
    $transaction: async <T>(callback: (transaction: PrismaClient) => T | Promise<T>) =>
      callback(prisma as unknown as PrismaClient),
    organizationBusinessHour: {
      deleteMany: async ({ where }: any) => {
        const organization = findOrganizationById(where.organizationId);

        if (!organization) {
          return { count: 0 };
        }

        const count = organization.businessHours.length;
        organization.businessHours = [];

        return { count };
      },
    },
    activeSchedulePlanningPeriod: {
      deleteMany: async ({ where }: any) => {
        const initialCount = state.activeSchedulePlanningPeriods.length;
        state.activeSchedulePlanningPeriods = state.activeSchedulePlanningPeriods.filter(
          (period) => period.organizationId !== where.organizationId,
        );

        return { count: initialCount - state.activeSchedulePlanningPeriods.length };
      },
      findUnique: async ({ where }: any) => {
        const period =
          state.activeSchedulePlanningPeriods.find(
            (currentPeriod) => currentPeriod.organizationId === where.organizationId,
          ) ?? null;

        return period ? cloneActiveSchedulePlanningPeriod(period) : null;
      },
      upsert: async ({ create, update, where }: any) => {
        const existingPeriod = state.activeSchedulePlanningPeriods.find(
          (period) => period.organizationId === where.organizationId,
        );
        const now = new Date("2026-06-25T00:00:00.000Z");

        if (existingPeriod) {
          Object.assign(existingPeriod, {
            ...update,
            updatedAt: now,
          });

          return cloneActiveSchedulePlanningPeriod(existingPeriod);
        }

        const period: FakeActiveSchedulePlanningPeriod = {
          id: state.nextPlanningPeriodId++,
          createdAt: now,
          updatedAt: now,
          ...create,
        };

        state.activeSchedulePlanningPeriods.push(period);

        return cloneActiveSchedulePlanningPeriod(period);
      },
    },
    minimumStaffingRule: {
      create: async ({ data }: any) => {
        const now = new Date("2026-06-25T00:00:00.000Z");
        const rule: FakeMinimumStaffingRule = {
          id: getNextId(state.minimumStaffingRules),
          createdAt: now,
          updatedAt: now,
          ...data,
        };

        state.minimumStaffingRules.push(rule);

        return cloneMinimumStaffingRule(rule);
      },
      deleteMany: async ({ where }: any) => {
        const initialCount = state.minimumStaffingRules.length;
        state.minimumStaffingRules = state.minimumStaffingRules.filter((rule) => {
          if (where.id !== undefined && rule.id !== where.id) {
            return true;
          }

          if (where.organizationId !== undefined && rule.organizationId !== where.organizationId) {
            return true;
          }

          return false;
        });

        return { count: initialCount - state.minimumStaffingRules.length };
      },
      findFirst: async ({ select, where }: any) => {
        const rule =
          state.minimumStaffingRules.find((currentRule) => {
            if (where.id !== undefined && currentRule.id !== where.id) {
              return false;
            }

            if (
              where.organizationId !== undefined &&
              currentRule.organizationId !== where.organizationId
            ) {
              return false;
            }

            return true;
          }) ?? null;

        if (!rule || !select) {
          return rule ? cloneMinimumStaffingRule(rule) : null;
        }

        return Object.fromEntries(
          Object.keys(select)
            .filter((key) => select[key])
            .map((key) => [key, rule[key as keyof FakeMinimumStaffingRule]]),
        );
      },
      findMany: async ({ orderBy, where }: any) => {
        const rules = state.minimumStaffingRules
          .filter((rule) => rule.organizationId === where.organizationId)
          .map(cloneMinimumStaffingRule);

        if (Array.isArray(orderBy)) {
          rules.sort((a, b) => {
            for (const order of orderBy) {
              if (order.dayOfWeek === "asc" && a.dayOfWeek !== b.dayOfWeek) {
                return dayOfWeekOrder[a.dayOfWeek] - dayOfWeekOrder[b.dayOfWeek];
              }

              if (order.startTime === "asc" && a.startTime.getTime() !== b.startTime.getTime()) {
                return a.startTime.getTime() - b.startTime.getTime();
              }
            }

            return 0;
          });
        }

        return rules;
      },
      update: async ({ data, where }: any) => {
        const rule = state.minimumStaffingRules.find((currentRule) => currentRule.id === where.id);

        if (!rule) {
          return null;
        }

        Object.assign(rule, {
          ...data,
          updatedAt: new Date("2026-06-25T00:00:00.000Z"),
        });

        return cloneMinimumStaffingRule(rule);
      },
    },
    organization: {
      create: async ({ data }: any) => {
        const organization: FakeOrganization = {
          id: state.nextOrganizationId,
          name: data.name,
          userId: data.userId,
          businessHours: data.businessHours.create.map((businessHour: any) => ({
            ...businessHour,
            id: state.nextBusinessHourId++,
            organizationId: state.nextOrganizationId,
          })),
        };

        state.nextOrganizationId++;
        state.organizations.push(organization);

        return toOrganizationResult(organization);
      },
      findUnique: async ({ where, ...options }: any) => {
        const organization =
          where.userId !== undefined
            ? findOrganizationByUserId(where.userId)
            : findOrganizationById(where.id);

        return toOrganizationResult(organization, options);
      },
      update: async ({ data, where, ...options }: any) => {
        const organization = findOrganizationById(where.id);

        if (!organization) {
          return null;
        }

        if (data.name !== undefined) {
          organization.name = data.name;
        }

        if (data.businessHours?.create) {
          organization.businessHours = data.businessHours.create.map((businessHour: any) => ({
            ...businessHour,
            id: state.nextBusinessHourId++,
            organizationId: organization.id,
          }));
        }

        return toOrganizationResult(organization, options);
      },
    },
    worker: {
      findFirst: async ({ select, where }: any) => {
        const worker =
          state.workers.find((currentWorker) => {
            if (where.id !== undefined && currentWorker.id !== where.id) {
              return false;
            }

            if (
              where.organizationId !== undefined &&
              currentWorker.organizationId !== where.organizationId
            ) {
              return false;
            }

            return true;
          }) ?? null;

        if (!worker || !select) {
          return worker ? { ...worker } : null;
        }

        return Object.fromEntries(
          Object.keys(select)
            .filter((key) => select[key])
            .map((key) => [key, worker[key as keyof FakeWorker]]),
        );
      },
      findMany: async ({ orderBy, where }: any) => {
        const matchingWorkers = state.workers
          .filter((worker) => {
            if (
              where.organizationId !== undefined &&
              worker.organizationId !== where.organizationId
            ) {
              return false;
            }

            return true;
          })
          .map((worker) => ({ ...worker }));

        if (orderBy?.employeeCode === "asc") {
          matchingWorkers.sort((a, b) => a.employeeCode.localeCompare(b.employeeCode));
        }

        return matchingWorkers;
      },
    },
    workerAvailableTime: {
      createMany: async ({ data }: any) => {
        const availableTimesToCreate = data.map((availableTime: any) => ({
          id: state.nextAvailableTimeId++,
          createdAt: new Date("2026-06-25T00:00:00.000Z"),
          updatedAt: new Date("2026-06-25T00:00:00.000Z"),
          ...availableTime,
        }));

        state.availableTimes.push(...availableTimesToCreate);

        return { count: availableTimesToCreate.length };
      },
      deleteMany: async ({ where }: any) => {
        const initialCount = state.availableTimes.length;
        state.availableTimes = state.availableTimes.filter((availableTime) => {
          if (where.workerId !== undefined && availableTime.workerId !== where.workerId) {
            return true;
          }

          if (where.worker?.organizationId !== undefined) {
            const worker = state.workers.find(
              (currentWorker) => currentWorker.id === availableTime.workerId,
            );

            if (!worker || worker.organizationId !== where.worker.organizationId) {
              return true;
            }
          }

          if (
            where.availableDate?.gte !== undefined &&
            availableTime.availableDate < where.availableDate.gte
          ) {
            return true;
          }

          if (
            where.availableDate?.lte !== undefined &&
            availableTime.availableDate > where.availableDate.lte
          ) {
            return true;
          }

          return false;
        });

        return { count: initialCount - state.availableTimes.length };
      },
      findMany: async ({ orderBy, where }: any) => {
        const matchingAvailableTimes = state.availableTimes
          .filter((availableTime) => {
            if (where.workerId !== undefined && availableTime.workerId !== where.workerId) {
              return false;
            }

            if (where.worker?.organizationId !== undefined) {
              const worker = state.workers.find(
                (currentWorker) => currentWorker.id === availableTime.workerId,
              );

              if (!worker || worker.organizationId !== where.worker.organizationId) {
                return false;
              }
            }

            if (
              where.availableDate?.gte !== undefined &&
              availableTime.availableDate < where.availableDate.gte
            ) {
              return false;
            }

            if (
              where.availableDate?.lte !== undefined &&
              availableTime.availableDate > where.availableDate.lte
            ) {
              return false;
            }

            return true;
          })
          .map(cloneWorkerAvailableTime);

        if (Array.isArray(orderBy)) {
          matchingAvailableTimes.sort((a, b) => {
            for (const order of orderBy) {
              if (
                order.availableDate === "asc" &&
                a.availableDate.getTime() !== b.availableDate.getTime()
              ) {
                return a.availableDate.getTime() - b.availableDate.getTime();
              }

              if (order.startsAt === "asc" && a.startsAt.getTime() !== b.startsAt.getTime()) {
                return a.startsAt.getTime() - b.startsAt.getTime();
              }
            }

            return 0;
          });
        }

        return matchingAvailableTimes;
      },
    },
    schedule: {
      create: async ({ data, ...options }: any) => {
        const now = new Date("2026-06-25T00:00:00.000Z");
        const organizationId = data.organization?.connect?.id ?? data.organizationId;
        const schedule: FakeSchedule = {
          id: state.nextScheduleId++,
          organizationId,
          status: data.status,
          inputHash: data.inputHash,
          startDate: cloneRequiredDate(data.startDate),
          endDate: cloneRequiredDate(data.endDate),
          generatedAt: cloneRequiredDate(data.generatedAt ?? now),
          confirmedAt: cloneDate(data.confirmedAt ?? null),
          createdAt: now,
          updatedAt: now,
        };

        state.schedules.push(schedule);

        const assignmentsToCreate = data.assignments?.create ?? [];
        state.scheduleAssignments.push(
          ...assignmentsToCreate.map((assignment: any) => ({
            id: state.nextScheduleAssignmentId++,
            scheduleId: schedule.id,
            workerId: assignment.worker?.connect?.id ?? assignment.workerId ?? null,
            workDate: cloneRequiredDate(assignment.workDate),
            startsAt: cloneRequiredDate(assignment.startsAt),
            endsAt: cloneRequiredDate(assignment.endsAt),
            workerNameSnapshot: assignment.workerNameSnapshot,
            employeeCodeSnapshot: assignment.employeeCodeSnapshot,
            createdAt: now,
            updatedAt: now,
          })),
        );

        const candidatesToCreate = data.candidates?.create ?? [];
        state.scheduleCandidates.push(
          ...candidatesToCreate.map((candidate: any) => ({
            id: state.nextScheduleCandidateId++,
            scheduleId: schedule.id,
            workerId: candidate.worker?.connect?.id ?? candidate.workerId ?? null,
            workDate: cloneRequiredDate(candidate.workDate),
            startsAt: cloneRequiredDate(candidate.startsAt),
            endsAt: cloneRequiredDate(candidate.endsAt),
            workerNameSnapshot: candidate.workerNameSnapshot,
            employeeCodeSnapshot: candidate.employeeCodeSnapshot,
            createdAt: now,
            updatedAt: now,
          })),
        );

        const shortagesToCreate = data.workerShortages?.create ?? [];
        state.scheduleWorkerShortages.push(
          ...shortagesToCreate.map((shortage: any) => ({
            id: state.nextScheduleWorkerShortageId++,
            scheduleId: schedule.id,
            workDate: cloneRequiredDate(shortage.workDate),
            dayOfWeek: shortage.dayOfWeek,
            startTime: cloneRequiredDate(shortage.startTime),
            endTime: cloneRequiredDate(shortage.endTime),
            endsNextDay: shortage.endsNextDay,
            requiredCount: shortage.requiredCount,
            assignedCount: shortage.assignedCount,
            createdAt: now,
            updatedAt: now,
          })),
        );

        return toScheduleResult(schedule, options);
      },
      findFirst: async ({ where, ...options }: any) => {
        const schedule = state.schedules.find((currentSchedule) =>
          matchesScheduleWhere(currentSchedule, where),
        );

        return toScheduleResult(schedule ?? null, options);
      },
      update: async ({ data, where, ...options }: any) => {
        const schedule = state.schedules.find((currentSchedule) => currentSchedule.id === where.id);

        if (!schedule) {
          return null;
        }

        Object.assign(schedule, {
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.confirmedAt !== undefined ? { confirmedAt: cloneDate(data.confirmedAt) } : {}),
          updatedAt: new Date("2026-06-25T00:00:00.000Z"),
        });

        return toScheduleResult(schedule, options);
      },
    },
    scheduleAssignment: {
      create: async ({ data }: any) => {
        const now = new Date("2026-06-25T00:00:00.000Z");
        const assignment: FakeScheduleAssignment = {
          id: state.nextScheduleAssignmentId++,
          scheduleId: data.scheduleId,
          workerId: data.workerId ?? null,
          workDate: cloneRequiredDate(data.workDate),
          startsAt: cloneRequiredDate(data.startsAt),
          endsAt: cloneRequiredDate(data.endsAt),
          workerNameSnapshot: data.workerNameSnapshot,
          employeeCodeSnapshot: data.employeeCodeSnapshot,
          createdAt: now,
          updatedAt: now,
        };

        state.scheduleAssignments.push(assignment);

        return cloneScheduleAssignment(assignment);
      },
      deleteMany: async ({ where }: any) => {
        const initialCount = state.scheduleAssignments.length;
        state.scheduleAssignments = state.scheduleAssignments.filter(
          (assignment) => !matchesScheduleAssignmentWhere(assignment, where),
        );

        return { count: initialCount - state.scheduleAssignments.length };
      },
      findFirst: async ({ where }: any) => {
        const assignment =
          state.scheduleAssignments.find((currentAssignment) =>
            matchesScheduleAssignmentWhere(currentAssignment, where),
          ) ?? null;

        return assignment ? cloneScheduleAssignment(assignment) : null;
      },
      update: async ({ data, where }: any) => {
        const assignment = state.scheduleAssignments.find(
          (currentAssignment) => currentAssignment.id === where.id,
        );

        if (!assignment) {
          return null;
        }

        Object.assign(assignment, {
          ...(data.workerId !== undefined ? { workerId: data.workerId } : {}),
          ...(data.workDate !== undefined ? { workDate: cloneRequiredDate(data.workDate) } : {}),
          ...(data.startsAt !== undefined ? { startsAt: cloneRequiredDate(data.startsAt) } : {}),
          ...(data.endsAt !== undefined ? { endsAt: cloneRequiredDate(data.endsAt) } : {}),
          ...(data.workerNameSnapshot !== undefined
            ? { workerNameSnapshot: data.workerNameSnapshot }
            : {}),
          ...(data.employeeCodeSnapshot !== undefined
            ? { employeeCodeSnapshot: data.employeeCodeSnapshot }
            : {}),
          updatedAt: new Date("2026-06-25T00:00:00.000Z"),
        });

        return cloneScheduleAssignment(assignment);
      },
    },
    refreshToken: {
      create: async ({ data }: any) => {
        const refreshToken = {
          id: state.nextRefreshTokenId++,
          revokedAt: null,
          ...data,
        };

        state.refreshTokens.push(refreshToken);

        return refreshToken;
      },
      findUnique: async ({ include, where }: any) => {
        const refreshToken =
          state.refreshTokens.find((token) => token.tokenHash === where.tokenHash) ?? null;

        if (!refreshToken || !include?.user) {
          return refreshToken;
        }

        return {
          ...refreshToken,
          user: state.users.find((user) => user.id === refreshToken.userId),
        };
      },
      update: async ({ data, where }: any) => {
        const refreshToken = state.refreshTokens.find((token) => token.id === where.id);

        if (!refreshToken) {
          return null;
        }

        Object.assign(refreshToken, data);

        return refreshToken;
      },
      updateMany: async ({ data, where }: any) => {
        const matchingTokens = state.refreshTokens.filter((token) => {
          if (where.id !== undefined && token.id !== where.id) {
            return false;
          }

          if (where.userId !== undefined && token.userId !== where.userId) {
            return false;
          }

          if (where.revokedAt === null && token.revokedAt !== null) {
            return false;
          }

          if (where.expiresAt?.gt && token.expiresAt <= where.expiresAt.gt) {
            return false;
          }

          return true;
        });

        matchingTokens.forEach((token) => Object.assign(token, data));

        return { count: matchingTokens.length };
      },
    },
    user: {
      create: async ({ data }: any) => {
        const user = {
          id: state.nextUserId++,
          ...data,
        };

        state.users.push(user);

        return user;
      },
      findUnique: async ({ include, where }: any) => {
        const user =
          where.email !== undefined
            ? state.users.find((currentUser) => currentUser.email === where.email)
            : state.users.find((currentUser) => currentUser.id === where.id);

        if (!user) {
          return null;
        }

        if (!include?.organization) {
          return user;
        }

        const organization = findOrganizationByUserId(user.id);

        return {
          ...user,
          organization: organization
            ? {
                id: organization.id,
                name: organization.name,
              }
            : null,
        };
      },
    },
  };

  return {
    prisma: prisma as unknown as PrismaClient,
    state,
  };
}

export const createTimeDate = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);

  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
};
