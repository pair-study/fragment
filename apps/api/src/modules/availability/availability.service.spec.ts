import type { PrismaClient } from "@fragment/database";
import { describe, expect, it, jest } from "@jest/globals";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { listAvailability, replaceAvailability } from "./availability.service";

const dateOnly = (date: string) => new Date(`${date}T00:00:00.000Z`);
const timestamp = new Date("2026-06-25T00:00:00.000Z");
const timeOfDay = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);

  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
};

const createAvailabilityRow = ({
  id = BigInt(10),
  workerId = BigInt(1),
  availableDate = dateOnly("2026-07-01"),
  startsAt = new Date("2026-07-01T10:00:00.000Z"),
  endsAt = new Date("2026-07-01T14:00:00.000Z"),
} = {}) => ({
  id,
  workerId,
  availableDate,
  startsAt,
  endsAt,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createBusinessHourRow = ({
  id = BigInt(1),
  organizationId = BigInt(1),
  dayOfWeek = "WED",
  isClosed = false,
  openTime = timeOfDay("09:00"),
  closeTime = timeOfDay("18:00"),
  closesNextDay = false,
} = {}) => ({
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

const createPrismaMock = ({
  organization = { id: BigInt(1), businessHours: [createBusinessHourRow()] },
  worker = { id: BigInt(1) },
  workerAvailableTime = {},
}: {
  organization?: { businessHours: ReturnType<typeof createBusinessHourRow>[]; id: bigint } | null;
  worker?: { id: bigint } | null;
  workerAvailableTime?: {
    createMany?: jest.Mock;
    deleteMany?: jest.Mock;
    findMany?: jest.Mock;
  };
} = {}) => {
  const organizationFindUnique = jest
    .fn<() => Promise<{ id: bigint } | null>>()
    .mockResolvedValue(organization);
  const workerFindFirst = jest.fn<() => Promise<{ id: bigint } | null>>().mockResolvedValue(worker);

  return {
    prisma: {
      $transaction: jest.fn(async (callback: (transaction: unknown) => unknown) =>
        callback({
          workerAvailableTime: {
            createMany: workerAvailableTime.createMany ?? jest.fn(),
            deleteMany: workerAvailableTime.deleteMany ?? jest.fn(),
            findMany: workerAvailableTime.findMany ?? jest.fn(),
          },
        }),
      ),
      organization: {
        findUnique: organizationFindUnique,
      },
      worker: {
        findFirst: workerFindFirst,
      },
      workerAvailableTime: {
        createMany: workerAvailableTime.createMany ?? jest.fn(),
        deleteMany: workerAvailableTime.deleteMany ?? jest.fn(),
        findMany: workerAvailableTime.findMany ?? jest.fn(),
      },
    } as unknown as PrismaClient,
    organizationFindUnique,
    workerFindFirst,
  };
};

describe("listAvailability", () => {
  it("rejects users without an organization", async () => {
    const availableTimeFindMany = jest.fn();
    const { prisma } = createPrismaMock({
      organization: null,
      workerAvailableTime: {
        findMany: availableTimeFindMany,
      },
    });

    await expect(
      listAvailability(prisma, "1", {
        workerId: "1",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.ORGANIZATION_REQUIRED,
      statusCode: 403,
    });
    expect(availableTimeFindMany).not.toHaveBeenCalled();
  });

  it("rejects workers outside the user's organization", async () => {
    const availableTimeFindMany = jest.fn();
    const { prisma, workerFindFirst } = createPrismaMock({
      worker: null,
      workerAvailableTime: {
        findMany: availableTimeFindMany,
      },
    });

    await expect(
      listAvailability(prisma, "1", {
        workerId: "10",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.WORKER_NOT_FOUND,
      statusCode: 404,
    });
    expect(workerFindFirst).toHaveBeenCalledWith({
      where: {
        id: BigInt(10),
        organizationId: BigInt(1),
      },
      select: {
        id: true,
      },
    });
    expect(availableTimeFindMany).not.toHaveBeenCalled();
  });

  it("lists availability in the selected date range ordered by date and start time", async () => {
    const availableTimeFindMany = jest
      .fn<() => Promise<ReturnType<typeof createAvailabilityRow>[]>>()
      .mockResolvedValue([
        createAvailabilityRow({
          id: BigInt(11),
          availableDate: dateOnly("2026-07-01"),
          startsAt: new Date("2026-07-01T10:00:00.000Z"),
          endsAt: new Date("2026-07-01T14:00:00.000Z"),
        }),
        createAvailabilityRow({
          id: BigInt(12),
          availableDate: dateOnly("2026-07-02"),
          startsAt: new Date("2026-07-02T09:00:00.000Z"),
          endsAt: new Date("2026-07-02T12:00:00.000Z"),
        }),
      ]);
    const { prisma } = createPrismaMock({
      workerAvailableTime: {
        findMany: availableTimeFindMany,
      },
    });

    await expect(
      listAvailability(prisma, "1", {
        workerId: "1",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      }),
    ).resolves.toEqual({
      items: [
        {
          id: "11",
          workerId: "1",
          availableDate: "2026-07-01",
          startsAt: "2026-07-01T10:00:00.000Z",
          endsAt: "2026-07-01T14:00:00.000Z",
        },
        {
          id: "12",
          workerId: "1",
          availableDate: "2026-07-02",
          startsAt: "2026-07-02T09:00:00.000Z",
          endsAt: "2026-07-02T12:00:00.000Z",
        },
      ],
    });
    expect(availableTimeFindMany).toHaveBeenCalledWith({
      where: {
        workerId: BigInt(1),
        availableDate: {
          gte: dateOnly("2026-07-01"),
          lte: dateOnly("2026-07-31"),
        },
      },
      orderBy: [{ availableDate: "asc" }, { startsAt: "asc" }],
    });
  });
});

describe("replaceAvailability", () => {
  it("rejects workers outside the user's organization", async () => {
    const availableTimeCreateMany = jest.fn();
    const availableTimeDeleteMany = jest.fn();
    const { prisma } = createPrismaMock({
      worker: null,
      workerAvailableTime: {
        createMany: availableTimeCreateMany,
        deleteMany: availableTimeDeleteMany,
      },
    });

    await expect(
      replaceAvailability(prisma, "1", {
        workerId: "10",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        items: [],
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.WORKER_NOT_FOUND,
      statusCode: 404,
    });
    expect(availableTimeDeleteMany).not.toHaveBeenCalled();
    expect(availableTimeCreateMany).not.toHaveBeenCalled();
  });

  it("replaces the selected date range with requested availability", async () => {
    const availableTimeDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({
      count: 2,
    });
    const availableTimeCreateMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({
      count: 1,
    });
    const availableTimeFindMany = jest
      .fn<() => Promise<ReturnType<typeof createAvailabilityRow>[]>>()
      .mockResolvedValue([
        createAvailabilityRow({
          id: BigInt(20),
          availableDate: dateOnly("2026-07-01"),
          startsAt: new Date("2026-07-01T09:00:00.000Z"),
          endsAt: new Date("2026-07-01T12:00:00.000Z"),
        }),
      ]);
    const { prisma } = createPrismaMock({
      workerAvailableTime: {
        createMany: availableTimeCreateMany,
        deleteMany: availableTimeDeleteMany,
        findMany: availableTimeFindMany,
      },
    });

    await expect(
      replaceAvailability(prisma, "1", {
        workerId: "1",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        items: [
          {
            availableDate: "2026-07-01",
            startsAt: "2026-07-01T09:00:00.000Z",
            endsAt: "2026-07-01T12:00:00.000Z",
          },
        ],
      }),
    ).resolves.toEqual({
      items: [
        {
          id: "20",
          workerId: "1",
          availableDate: "2026-07-01",
          startsAt: "2026-07-01T09:00:00.000Z",
          endsAt: "2026-07-01T12:00:00.000Z",
        },
      ],
    });
    expect(availableTimeDeleteMany).toHaveBeenCalledWith({
      where: {
        workerId: BigInt(1),
        availableDate: {
          gte: dateOnly("2026-07-01"),
          lte: dateOnly("2026-07-31"),
        },
      },
    });
    expect(availableTimeCreateMany).toHaveBeenCalledWith({
      data: [
        {
          workerId: BigInt(1),
          availableDate: dateOnly("2026-07-01"),
          startsAt: new Date("2026-07-01T09:00:00.000Z"),
          endsAt: new Date("2026-07-01T12:00:00.000Z"),
        },
      ],
    });
  });

  it("rejects items outside the selected date range", async () => {
    const availableTimeDeleteMany = jest.fn();
    const { prisma } = createPrismaMock({
      workerAvailableTime: {
        deleteMany: availableTimeDeleteMany,
      },
    });

    await expect(
      replaceAvailability(prisma, "1", {
        workerId: "1",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        items: [
          {
            availableDate: "2026-08-01",
            startsAt: "2026-08-01T10:00:00.000Z",
            endsAt: "2026-08-01T12:00:00.000Z",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_TIME_RANGE,
      statusCode: 400,
    });
    expect(availableTimeDeleteMany).not.toHaveBeenCalled();
  });

  it("rejects availability on closed days", async () => {
    const { prisma } = createPrismaMock({
      organization: {
        id: BigInt(1),
        businessHours: [
          createBusinessHourRow({
            isClosed: true,
            openTime: null,
            closeTime: null,
          }),
        ],
      },
    });

    await expect(
      replaceAvailability(prisma, "1", {
        workerId: "1",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        items: [
          {
            availableDate: "2026-07-01",
            startsAt: "2026-07-01T10:00:00.000Z",
            endsAt: "2026-07-01T12:00:00.000Z",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.CLOSED_DAY,
      statusCode: 400,
    });
  });

  it("rejects availability outside business hours", async () => {
    const { prisma } = createPrismaMock();

    await expect(
      replaceAvailability(prisma, "1", {
        workerId: "1",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        items: [
          {
            availableDate: "2026-07-01",
            startsAt: "2026-07-01T08:30:00.000Z",
            endsAt: "2026-07-01T10:00:00.000Z",
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_TIME_RANGE,
      statusCode: 400,
    });
  });

  it("allows availability inside overnight business hours", async () => {
    const availableTimeDeleteMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({
      count: 0,
    });
    const availableTimeCreateMany = jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({
      count: 1,
    });
    const availableTimeFindMany = jest
      .fn<() => Promise<ReturnType<typeof createAvailabilityRow>[]>>()
      .mockResolvedValue([]);
    const { prisma } = createPrismaMock({
      organization: {
        id: BigInt(1),
        businessHours: [
          createBusinessHourRow({
            dayOfWeek: "FRI",
            openTime: timeOfDay("22:00"),
            closeTime: timeOfDay("02:00"),
            closesNextDay: true,
          }),
        ],
      },
      workerAvailableTime: {
        createMany: availableTimeCreateMany,
        deleteMany: availableTimeDeleteMany,
        findMany: availableTimeFindMany,
      },
    });

    await expect(
      replaceAvailability(prisma, "1", {
        workerId: "1",
        startDate: "2026-07-03",
        endDate: "2026-07-03",
        items: [
          {
            availableDate: "2026-07-03",
            startsAt: "2026-07-04T00:00:00.000Z",
            endsAt: "2026-07-04T01:30:00.000Z",
          },
        ],
      }),
    ).resolves.toEqual({
      items: [],
    });
    expect(availableTimeCreateMany).toHaveBeenCalledWith({
      data: [
        {
          workerId: BigInt(1),
          availableDate: dateOnly("2026-07-03"),
          startsAt: new Date("2026-07-04T00:00:00.000Z"),
          endsAt: new Date("2026-07-04T01:30:00.000Z"),
        },
      ],
    });
  });
});
