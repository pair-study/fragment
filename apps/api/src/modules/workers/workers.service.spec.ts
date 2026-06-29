import type { PrismaClient } from "@fragment/database";
import { describe, expect, it, jest } from "@jest/globals";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { createWorker, deleteWorker, listWorkers, updateWorker } from "./workers.service";

const createWorkerRow = ({
  id = BigInt(1),
  organizationId = BigInt(1),
  employeeCode = "W-0001",
  name = "김민수",
  weeklyContractHours = 40,
} = {}) => ({
  id,
  organizationId,
  employeeCode,
  name,
  weeklyContractHours,
});

type WorkerModelMocks = {
  create?: jest.Mock;
  delete?: jest.Mock;
  findFirst?: jest.Mock;
  findMany?: jest.Mock;
  update?: jest.Mock;
};

type OrganizationModelMocks = {
  update?: jest.Mock;
};

const createPrismaMock = ({
  organization = {},
  worker = {},
}: {
  organization?: OrganizationModelMocks;
  worker?: WorkerModelMocks;
} = {}) => {
  const prisma = {
    $transaction: jest.fn(async (callback: (transaction: unknown) => unknown) => callback(prisma)),
    organization: {
      update: organization.update ?? jest.fn(),
    },
    worker: {
      create: worker.create ?? jest.fn(),
      delete: worker.delete ?? jest.fn(),
      findFirst: worker.findFirst ?? jest.fn(),
      findMany: worker.findMany ?? jest.fn(),
      update: worker.update ?? jest.fn(),
    },
  };

  return prisma as unknown as PrismaClient;
};

describe("listWorkers", () => {
  it("lists workers scoped to the organization ordered by employee code", async () => {
    const workerFindMany = jest.fn<() => Promise<ReturnType<typeof createWorkerRow>[]>>();
    workerFindMany.mockResolvedValue([
      createWorkerRow({
        id: BigInt(2),
        employeeCode: "W-0001",
        name: "김민지",
        weeklyContractHours: 20,
      }),
      createWorkerRow({
        id: BigInt(1),
        employeeCode: "W-0002",
        name: "박준호",
        weeklyContractHours: 24,
      }),
    ]);
    const prisma = createPrismaMock({
      worker: {
        findMany: workerFindMany,
      },
    });

    await expect(listWorkers(prisma, "1")).resolves.toEqual({
      items: [
        {
          id: "2",
          employeeCode: "W-0001",
          name: "김민지",
          weeklyContractHours: 20,
        },
        {
          id: "1",
          employeeCode: "W-0002",
          name: "박준호",
          weeklyContractHours: 24,
        },
      ],
    });
    expect(workerFindMany).toHaveBeenCalledWith({
      where: {
        organizationId: BigInt(1),
      },
      orderBy: {
        employeeCode: "asc",
      },
    });
  });
});

describe("createWorker", () => {
  it("increments the organization sequence and creates the next employee code", async () => {
    const organizationUpdate = jest
      .fn<() => Promise<{ lastWorkerSequence: number }>>()
      .mockResolvedValue({
        lastWorkerSequence: 13,
      });
    const workerCreate = jest
      .fn<() => Promise<ReturnType<typeof createWorkerRow>>>()
      .mockResolvedValue(
        createWorkerRow({
          employeeCode: "W-0013",
        }),
      );
    const prisma = createPrismaMock({
      organization: {
        update: organizationUpdate,
      },
      worker: {
        create: workerCreate,
      },
    });

    await expect(
      createWorker(prisma, "1", {
        name: "김민수",
        weeklyContractHours: 40,
      }),
    ).resolves.toEqual({
      id: "1",
      employeeCode: "W-0013",
      name: "김민수",
      weeklyContractHours: 40,
    });
    expect(organizationUpdate).toHaveBeenCalledWith({
      where: {
        id: BigInt(1),
      },
      data: {
        lastWorkerSequence: {
          increment: 1,
        },
      },
      select: {
        lastWorkerSequence: true,
      },
    });
    expect(workerCreate).toHaveBeenCalledWith({
      data: {
        organizationId: BigInt(1),
        employeeCode: "W-0013",
        name: "김민수",
        weeklyContractHours: 40,
      },
    });
  });
});

describe("updateWorker", () => {
  it("rejects workers outside the organization", async () => {
    const workerFindFirst = jest.fn<() => Promise<null>>().mockResolvedValue(null);
    const workerUpdate = jest.fn();
    const prisma = createPrismaMock({
      worker: {
        findFirst: workerFindFirst,
        update: workerUpdate,
      },
    });

    await expect(
      updateWorker(prisma, "1", "10", {
        name: "김민준",
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
    });
    expect(workerUpdate).not.toHaveBeenCalled();
  });

  it("updates only provided worker fields", async () => {
    const workerFindFirst = jest
      .fn<() => Promise<ReturnType<typeof createWorkerRow>>>()
      .mockResolvedValue(createWorkerRow());
    const workerUpdate = jest
      .fn<() => Promise<ReturnType<typeof createWorkerRow>>>()
      .mockResolvedValue(
        createWorkerRow({
          name: "김민준",
        }),
      );
    const prisma = createPrismaMock({
      worker: {
        findFirst: workerFindFirst,
        update: workerUpdate,
      },
    });

    await expect(
      updateWorker(prisma, "1", "1", {
        name: "김민준",
      }),
    ).resolves.toMatchObject({
      id: "1",
      name: "김민준",
      weeklyContractHours: 40,
    });
    expect(workerUpdate).toHaveBeenCalledWith({
      where: {
        id: BigInt(1),
      },
      data: {
        name: "김민준",
      },
    });
  });
});

describe("deleteWorker", () => {
  it("rejects workers outside the organization", async () => {
    const workerFindFirst = jest.fn<() => Promise<null>>().mockResolvedValue(null);
    const workerDelete = jest.fn();
    const prisma = createPrismaMock({
      worker: {
        delete: workerDelete,
        findFirst: workerFindFirst,
      },
    });

    await expect(deleteWorker(prisma, "1", "10")).rejects.toMatchObject({
      code: ERROR_CODES.WORKER_NOT_FOUND,
      statusCode: 404,
    });
    expect(workerFindFirst).toHaveBeenCalledWith({
      where: {
        id: BigInt(10),
        organizationId: BigInt(1),
      },
    });
    expect(workerDelete).not.toHaveBeenCalled();
  });

  it("deletes a worker after checking organization scope", async () => {
    const workerFindFirst = jest
      .fn<() => Promise<ReturnType<typeof createWorkerRow>>>()
      .mockResolvedValue(createWorkerRow());
    const workerDelete = jest.fn<() => Promise<ReturnType<typeof createWorkerRow>>>();
    workerDelete.mockResolvedValue(createWorkerRow());
    const prisma = createPrismaMock({
      worker: {
        delete: workerDelete,
        findFirst: workerFindFirst,
      },
    });

    await expect(deleteWorker(prisma, "1", "1")).resolves.toBeUndefined();
    expect(workerDelete).toHaveBeenCalledWith({
      where: {
        id: BigInt(1),
      },
    });
  });
});
