import { Prisma, type PrismaClient } from "@fragment/database";
import type {
  CreateWorkerRequest,
  UpdateWorkerRequest,
  Worker,
  WorkersListResponse,
} from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { toApiId, toPrismaId } from "@/utils/mapper";

type WorkersDatabaseClient = PrismaClient | Prisma.TransactionClient;

type WorkerRecord = Prisma.WorkerGetPayload<object>;

const formatEmployeeCode = (sequence: number) => `W-${String(sequence).padStart(4, "0")}`;

const toWorker = (worker: WorkerRecord): Worker => ({
  id: toApiId(worker.id),
  employeeCode: worker.employeeCode,
  name: worker.name,
  weeklyContractHours: worker.weeklyContractHours,
});

async function findWorkerByOrganization(
  client: WorkersDatabaseClient,
  organizationId: bigint,
  workerId: bigint,
) {
  return client.worker.findFirst({
    where: {
      id: workerId,
      organizationId,
    },
  });
}

export async function listWorkers(
  prisma: PrismaClient,
  organizationId: string,
): Promise<WorkersListResponse> {
  const organizationDatabaseId = toPrismaId(organizationId);
  const workers = await prisma.worker.findMany({
    where: {
      organizationId: organizationDatabaseId,
    },
    orderBy: {
      employeeCode: "asc",
    },
  });

  return {
    items: workers.map(toWorker),
  };
}

export async function createWorker(
  prisma: PrismaClient,
  organizationId: string,
  input: CreateWorkerRequest,
): Promise<Worker> {
  const organizationDatabaseId = toPrismaId(organizationId);

  return prisma.$transaction(async (transaction) => {
    const organization = await transaction.organization.update({
      where: {
        id: organizationDatabaseId,
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

    const worker = await transaction.worker.create({
      data: {
        organizationId: organizationDatabaseId,
        employeeCode: formatEmployeeCode(organization.lastWorkerSequence),
        name: input.name,
        weeklyContractHours: input.weeklyContractHours,
      },
    });

    return toWorker(worker);
  });
}

export async function updateWorker(
  prisma: PrismaClient,
  organizationId: string,
  workerId: string,
  input: UpdateWorkerRequest,
): Promise<Worker> {
  const organizationDatabaseId = toPrismaId(organizationId);
  const workerDatabaseId = toPrismaId(workerId);

  return prisma.$transaction(async (transaction) => {
    const worker = await findWorkerByOrganization(
      transaction,
      organizationDatabaseId,
      workerDatabaseId,
    );

    if (!worker) {
      throw new HttpError(404, ERROR_CODES.WORKER_NOT_FOUND, "근무자를 찾을 수 없습니다.");
    }

    const updatedWorker = await transaction.worker.update({
      where: {
        id: worker.id,
      },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.weeklyContractHours !== undefined
          ? { weeklyContractHours: input.weeklyContractHours }
          : {}),
      },
    });

    return toWorker(updatedWorker);
  });
}

export async function deleteWorker(
  prisma: PrismaClient,
  organizationId: string,
  workerId: string,
): Promise<void> {
  const organizationDatabaseId = toPrismaId(organizationId);
  const workerDatabaseId = toPrismaId(workerId);

  await prisma.$transaction(async (transaction) => {
    const worker = await findWorkerByOrganization(
      transaction,
      organizationDatabaseId,
      workerDatabaseId,
    );

    if (!worker) {
      throw new HttpError(404, ERROR_CODES.WORKER_NOT_FOUND, "근무자를 찾을 수 없습니다.");
    }

    await transaction.worker.delete({
      where: {
        id: worker.id,
      },
    });
  });
}
