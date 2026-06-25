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
  minimumStaffingRules?: FakeMinimumStaffingRule[];
  organizations?: FakeOrganization[];
  refreshTokens?: FakeRefreshToken[];
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

const getNextId = <T extends { id: bigint }>(items: T[]) =>
  items.reduce((nextId, item) => (item.id >= nextId ? item.id + BigInt(1) : nextId), BigInt(1));

const dayOfWeekOrder = Object.fromEntries(
  DAY_OF_WEEK_VALUES.map((dayOfWeek, index) => [dayOfWeek, index]),
) as Record<(typeof DAY_OF_WEEK_VALUES)[number], number>;

export function createFakePrisma({
  activeSchedulePlanningPeriods = [],
  minimumStaffingRules = [],
  organizations = [],
  refreshTokens = [],
  users = [],
  workers = [],
}: CreateFakePrismaOptions = {}) {
  const state = {
    nextBusinessHourId: getNextId(
      organizations.flatMap((organization) => organization.businessHours),
    ),
    nextOrganizationId: getNextId(organizations),
    nextPlanningPeriodId: getNextId(activeSchedulePlanningPeriods),
    nextRefreshTokenId: getNextId(refreshTokens),
    nextUserId: getNextId(users),
    activeSchedulePlanningPeriods: activeSchedulePlanningPeriods.map(
      cloneActiveSchedulePlanningPeriod,
    ),
    minimumStaffingRules: minimumStaffingRules.map(cloneMinimumStaffingRule),
    organizations: organizations.map((organization) => ({
      ...organization,
      businessHours: organization.businessHours.map(cloneBusinessHour),
    })),
    refreshTokens: refreshTokens.map((refreshToken) => ({ ...refreshToken })),
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

    return {
      ...organization,
      businessHours: organization.businessHours.map(cloneBusinessHour),
    };
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
