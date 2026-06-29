import type { DayOfWeek, OrganizationBusinessHour, PrismaClient } from "@fragment/database";
import { describe, expect, it, jest } from "@jest/globals";

import { ERROR_CODES } from "@/common/constants/error-codes";
import {
  createMinimumStaffingRule,
  deleteMinimumStaffingRule,
  getMinimumStaffingRules,
  updateMinimumStaffingRule,
} from "./staffing-rules.service";

const timeOfDay = (hour: number, minute: number) => new Date(Date.UTC(1970, 0, 1, hour, minute));
const timestamp = new Date("2026-06-25T00:00:00.000Z");

const createBusinessHour = ({
  closeTime = timeOfDay(18, 0),
  closesNextDay = false,
  dayOfWeek = "MON",
  id = BigInt(1),
  isClosed = false,
  openTime = timeOfDay(9, 0),
  organizationId = BigInt(1),
}: Partial<OrganizationBusinessHour> = {}): OrganizationBusinessHour => ({
  id,
  organizationId,
  dayOfWeek,
  isClosed,
  openTime,
  closeTime,
  closesNextDay,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createRuleRow = ({
  id = BigInt(10),
  organizationId = BigInt(1),
  dayOfWeek = "MON" as DayOfWeek,
  startTime = timeOfDay(10, 0),
  endTime = timeOfDay(14, 0),
  endsNextDay = false,
  requiredCount = 2,
} = {}) => ({
  id,
  organizationId,
  dayOfWeek,
  startTime,
  endTime,
  endsNextDay,
  requiredCount,
  createdAt: timestamp,
  updatedAt: timestamp,
});

type OrganizationRow = {
  businessHours: OrganizationBusinessHour[];
  id: bigint;
};

const createPrismaMock = ({
  organization = { businessHours: [createBusinessHour()], id: BigInt(1) },
  minimumStaffingRule = {},
}: {
  organization?: OrganizationRow | null;
  minimumStaffingRule?: {
    create?: jest.Mock;
    deleteMany?: jest.Mock;
    findFirst?: jest.Mock;
    findMany?: jest.Mock;
    update?: jest.Mock;
  };
} = {}) => {
  const organizationFindUnique = jest
    .fn<() => Promise<OrganizationRow | null>>()
    .mockResolvedValue(organization);

  return {
    prisma: {
      activeSchedulePlanningPeriod: {
        findUnique: jest.fn<() => Promise<null>>().mockResolvedValue(null),
      },
      organization: {
        findUnique: organizationFindUnique,
      },
      minimumStaffingRule: {
        create: minimumStaffingRule.create ?? jest.fn(),
        deleteMany: minimumStaffingRule.deleteMany ?? jest.fn(),
        findFirst: minimumStaffingRule.findFirst ?? jest.fn(),
        findMany: minimumStaffingRule.findMany ?? jest.fn(),
        update: minimumStaffingRule.update ?? jest.fn(),
      },
    } as unknown as PrismaClient,
    organizationFindUnique,
  };
};

describe("getMinimumStaffingRules", () => {
  it("rejects users without an organization", async () => {
    const minimumStaffingRuleFindMany = jest.fn();
    const { prisma } = createPrismaMock({
      organization: null,
      minimumStaffingRule: {
        findMany: minimumStaffingRuleFindMany,
      },
    });

    await expect(getMinimumStaffingRules(prisma, "1")).rejects.toMatchObject({
      code: ERROR_CODES.ORGANIZATION_REQUIRED,
      statusCode: 403,
    });
    expect(minimumStaffingRuleFindMany).not.toHaveBeenCalled();
  });

  it("returns rules scoped to the user's organization with HH:mm time values", async () => {
    const minimumStaffingRuleFindMany = jest
      .fn<() => Promise<ReturnType<typeof createRuleRow>[]>>()
      .mockResolvedValue([
        createRuleRow({
          id: BigInt(10),
          startTime: timeOfDay(9, 30),
          endTime: timeOfDay(14, 0),
        }),
      ]);
    const { prisma } = createPrismaMock({
      minimumStaffingRule: {
        findMany: minimumStaffingRuleFindMany,
      },
    });

    await expect(getMinimumStaffingRules(prisma, "1")).resolves.toEqual({
      items: [
        {
          id: "10",
          dayOfWeek: "MON",
          startTime: "09:30",
          endTime: "14:00",
          endsNextDay: false,
          requiredCount: 2,
        },
      ],
    });
    expect(minimumStaffingRuleFindMany).toHaveBeenCalledWith({
      where: {
        organizationId: BigInt(1),
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  });
});

describe("createMinimumStaffingRule", () => {
  it("creates a rule for the user's organization with DB time values", async () => {
    const minimumStaffingRuleCreate = jest
      .fn<() => Promise<ReturnType<typeof createRuleRow>>>()
      .mockResolvedValue(
        createRuleRow({
          startTime: timeOfDay(22, 0),
          endTime: timeOfDay(2, 0),
          endsNextDay: true,
          requiredCount: 3,
        }),
      );
    const { prisma } = createPrismaMock({
      organization: {
        id: BigInt(1),
        businessHours: [
          createBusinessHour({
            closeTime: timeOfDay(2, 0),
            closesNextDay: true,
            dayOfWeek: "FRI",
            openTime: timeOfDay(22, 0),
          }),
        ],
      },
      minimumStaffingRule: {
        create: minimumStaffingRuleCreate,
      },
    });

    await expect(
      createMinimumStaffingRule(prisma, "1", {
        dayOfWeek: "FRI",
        startTime: "22:00",
        endTime: "02:00",
        endsNextDay: true,
        requiredCount: 3,
      }),
    ).resolves.toMatchObject({
      startTime: "22:00",
      endTime: "02:00",
      endsNextDay: true,
      requiredCount: 3,
    });
    expect(minimumStaffingRuleCreate).toHaveBeenCalledWith({
      data: {
        organizationId: BigInt(1),
        dayOfWeek: "FRI",
        startTime: timeOfDay(22, 0),
        endTime: timeOfDay(2, 0),
        endsNextDay: true,
        requiredCount: 3,
      },
    });
  });

  it("rejects rules on closed business days", async () => {
    const minimumStaffingRuleCreate = jest.fn();
    const { prisma } = createPrismaMock({
      organization: {
        id: BigInt(1),
        businessHours: [
          createBusinessHour({
            closeTime: null,
            dayOfWeek: "MON",
            isClosed: true,
            openTime: null,
          }),
        ],
      },
      minimumStaffingRule: {
        create: minimumStaffingRuleCreate,
      },
    });

    await expect(
      createMinimumStaffingRule(prisma, "1", {
        dayOfWeek: "MON",
        startTime: "10:00",
        endTime: "14:00",
        endsNextDay: false,
        requiredCount: 2,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.CLOSED_DAY,
      statusCode: 400,
    });
    expect(minimumStaffingRuleCreate).not.toHaveBeenCalled();
  });

  it("rejects rules outside business hours", async () => {
    const minimumStaffingRuleCreate = jest.fn();
    const { prisma } = createPrismaMock({
      minimumStaffingRule: {
        create: minimumStaffingRuleCreate,
      },
    });

    await expect(
      createMinimumStaffingRule(prisma, "1", {
        dayOfWeek: "MON",
        startTime: "08:00",
        endTime: "10:00",
        endsNextDay: false,
        requiredCount: 2,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_TIME_RANGE,
      statusCode: 400,
    });
    expect(minimumStaffingRuleCreate).not.toHaveBeenCalled();
  });
});

describe("updateMinimumStaffingRule", () => {
  it("rejects rules outside the user's organization", async () => {
    const minimumStaffingRuleFindFirst = jest.fn<() => Promise<null>>().mockResolvedValue(null);
    const minimumStaffingRuleUpdate = jest.fn();
    const { prisma } = createPrismaMock({
      minimumStaffingRule: {
        findFirst: minimumStaffingRuleFindFirst,
        update: minimumStaffingRuleUpdate,
      },
    });

    await expect(
      updateMinimumStaffingRule(prisma, "1", "10", {
        requiredCount: 3,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      statusCode: 404,
    });
    expect(minimumStaffingRuleFindFirst).toHaveBeenCalledWith({
      where: {
        id: BigInt(10),
        organizationId: BigInt(1),
      },
      select: {
        dayOfWeek: true,
        endTime: true,
        endsNextDay: true,
        id: true,
        startTime: true,
      },
    });
    expect(minimumStaffingRuleUpdate).not.toHaveBeenCalled();
  });

  it("rejects endsNextDay-only updates when the merged time range is invalid", async () => {
    const minimumStaffingRuleFindFirst = jest
      .fn<
        () => Promise<{
          dayOfWeek: DayOfWeek;
          endTime: Date;
          endsNextDay: boolean;
          id: bigint;
          startTime: Date;
        }>
      >()
      .mockResolvedValue({
        dayOfWeek: "MON",
        id: BigInt(10),
        startTime: timeOfDay(10, 0),
        endTime: timeOfDay(14, 0),
        endsNextDay: false,
      });
    const minimumStaffingRuleUpdate = jest.fn();
    const { prisma } = createPrismaMock({
      minimumStaffingRule: {
        findFirst: minimumStaffingRuleFindFirst,
        update: minimumStaffingRuleUpdate,
      },
    });

    await expect(
      updateMinimumStaffingRule(prisma, "1", "10", {
        endsNextDay: true,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      statusCode: 400,
    });
    expect(minimumStaffingRuleUpdate).not.toHaveBeenCalled();
  });

  it("rejects updates that move a rule outside business hours", async () => {
    const minimumStaffingRuleFindFirst = jest
      .fn<
        () => Promise<{
          dayOfWeek: DayOfWeek;
          endTime: Date;
          endsNextDay: boolean;
          id: bigint;
          startTime: Date;
        }>
      >()
      .mockResolvedValue({
        dayOfWeek: "MON",
        id: BigInt(10),
        startTime: timeOfDay(10, 0),
        endTime: timeOfDay(14, 0),
        endsNextDay: false,
      });
    const minimumStaffingRuleUpdate = jest.fn();
    const { prisma } = createPrismaMock({
      minimumStaffingRule: {
        findFirst: minimumStaffingRuleFindFirst,
        update: minimumStaffingRuleUpdate,
      },
    });

    await expect(
      updateMinimumStaffingRule(prisma, "1", "10", {
        startTime: "08:00",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_TIME_RANGE,
      statusCode: 400,
    });
    expect(minimumStaffingRuleUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteMinimumStaffingRule", () => {
  it("rejects rules outside the user's organization", async () => {
    const minimumStaffingRuleDeleteMany = jest
      .fn<() => Promise<{ count: number }>>()
      .mockResolvedValue({
        count: 0,
      });
    const { prisma } = createPrismaMock({
      minimumStaffingRule: {
        deleteMany: minimumStaffingRuleDeleteMany,
      },
    });

    await expect(deleteMinimumStaffingRule(prisma, "1", "10")).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      statusCode: 404,
    });
    expect(minimumStaffingRuleDeleteMany).toHaveBeenCalledWith({
      where: {
        id: BigInt(10),
        organizationId: BigInt(1),
      },
    });
  });
});
