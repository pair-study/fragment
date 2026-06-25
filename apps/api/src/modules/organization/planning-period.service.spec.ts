import type { PrismaClient } from "@fragment/database";
import { describe, expect, it, jest } from "@jest/globals";

import { ERROR_CODES } from "@/common/constants/error-codes";
import {
  deleteActiveSchedulePlanningPeriod,
  getActiveSchedulePlanningPeriod,
  upsertActiveSchedulePlanningPeriod,
} from "./planning-period.service";

const dateOnly = (date: string) => new Date(`${date}T00:00:00.000Z`);
const timestamp = new Date("2026-06-25T00:00:00.000Z");

const createPeriodRow = ({
  id = BigInt(10),
  organizationId = BigInt(1),
  startDate = dateOnly("2026-07-01"),
  endDate = dateOnly("2026-07-31"),
} = {}) => ({
  id,
  organizationId,
  startDate,
  endDate,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createPrismaMock = ({
  activeSchedulePlanningPeriod = {},
  organization = { id: BigInt(1) },
}: {
  activeSchedulePlanningPeriod?: {
    deleteMany?: jest.Mock;
    findUnique?: jest.Mock;
    upsert?: jest.Mock;
  };
  organization?: { id: bigint } | null;
} = {}) => {
  const organizationFindUnique = jest
    .fn<() => Promise<{ id: bigint } | null>>()
    .mockResolvedValue(organization);

  return {
    prisma: {
      activeSchedulePlanningPeriod: {
        deleteMany: activeSchedulePlanningPeriod.deleteMany ?? jest.fn(),
        findUnique: activeSchedulePlanningPeriod.findUnique ?? jest.fn(),
        upsert: activeSchedulePlanningPeriod.upsert ?? jest.fn(),
      },
      organization: {
        findUnique: organizationFindUnique,
      },
    } as unknown as PrismaClient,
    organizationFindUnique,
  };
};

describe("getActiveSchedulePlanningPeriod", () => {
  it("rejects users without an organization", async () => {
    const periodFindUnique = jest.fn();
    const { prisma } = createPrismaMock({
      activeSchedulePlanningPeriod: {
        findUnique: periodFindUnique,
      },
      organization: null,
    });

    await expect(getActiveSchedulePlanningPeriod(prisma, "1")).rejects.toMatchObject({
      code: ERROR_CODES.ORGANIZATION_REQUIRED,
      statusCode: 403,
    });
    expect(periodFindUnique).not.toHaveBeenCalled();
  });

  it("returns null when the organization has no active period", async () => {
    const periodFindUnique = jest.fn<() => Promise<null>>().mockResolvedValue(null);
    const { prisma } = createPrismaMock({
      activeSchedulePlanningPeriod: {
        findUnique: periodFindUnique,
      },
    });

    await expect(getActiveSchedulePlanningPeriod(prisma, "1")).resolves.toEqual({
      period: null,
    });
    expect(periodFindUnique).toHaveBeenCalledWith({
      where: {
        organizationId: BigInt(1),
      },
    });
  });

  it("returns the active period with API id and date strings", async () => {
    const periodFindUnique = jest
      .fn<() => Promise<ReturnType<typeof createPeriodRow>>>()
      .mockResolvedValue(createPeriodRow());
    const { prisma } = createPrismaMock({
      activeSchedulePlanningPeriod: {
        findUnique: periodFindUnique,
      },
    });

    await expect(getActiveSchedulePlanningPeriod(prisma, "1")).resolves.toEqual({
      period: {
        id: "10",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      },
    });
  });
});

describe("upsertActiveSchedulePlanningPeriod", () => {
  it("upserts the period scoped to the user's organization", async () => {
    const periodUpsert = jest
      .fn<() => Promise<ReturnType<typeof createPeriodRow>>>()
      .mockResolvedValue(
        createPeriodRow({
          startDate: dateOnly("2026-08-01"),
          endDate: dateOnly("2026-08-15"),
        }),
      );
    const { prisma } = createPrismaMock({
      activeSchedulePlanningPeriod: {
        upsert: periodUpsert,
      },
    });

    await expect(
      upsertActiveSchedulePlanningPeriod(prisma, "1", {
        startDate: "2026-08-01",
        endDate: "2026-08-15",
      }),
    ).resolves.toEqual({
      id: "10",
      startDate: "2026-08-01",
      endDate: "2026-08-15",
    });
    expect(periodUpsert).toHaveBeenCalledWith({
      where: {
        organizationId: BigInt(1),
      },
      create: {
        organizationId: BigInt(1),
        startDate: dateOnly("2026-08-01"),
        endDate: dateOnly("2026-08-15"),
      },
      update: {
        startDate: dateOnly("2026-08-01"),
        endDate: dateOnly("2026-08-15"),
      },
    });
  });
});

describe("deleteActiveSchedulePlanningPeriod", () => {
  it("deletes the period scoped to the user's organization", async () => {
    const periodDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({
      count: 1,
    });
    const { prisma } = createPrismaMock({
      activeSchedulePlanningPeriod: {
        deleteMany: periodDeleteMany,
      },
    });

    await expect(deleteActiveSchedulePlanningPeriod(prisma, "1")).resolves.toBeUndefined();
    expect(periodDeleteMany).toHaveBeenCalledWith({
      where: {
        organizationId: BigInt(1),
      },
    });
  });
});
