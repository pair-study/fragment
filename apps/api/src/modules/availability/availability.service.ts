import type {
  Prisma,
  PrismaClient,
  WorkerAvailableTime as PrismaWorkerAvailableTime,
} from "@fragment/database";
import type { Availability, AvailabilityListResponse, AvailabilityQuery } from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { toApiId, toPrismaId } from "@/utils/mapper";

type AvailabilityDatabaseClient = PrismaClient | Prisma.TransactionClient;

const dateStringToDate = (date: string) => new Date(`${date}T00:00:00.000Z`);

const dateToDateString = (date: Date) => date.toISOString().slice(0, 10);

const findOrganizationIdByUserId = async (prisma: PrismaClient, userId: string) => {
  const organization = await prisma.organization.findUnique({
    where: {
      userId: toPrismaId(userId),
    },
    select: {
      id: true,
    },
  });

  if (!organization) {
    throw new HttpError(403, ERROR_CODES.ORGANIZATION_REQUIRED, "조직 생성 후 이용할 수 있습니다.");
  }

  return organization.id;
};

const findWorkerByOrganization = async (
  client: AvailabilityDatabaseClient,
  organizationId: bigint,
  workerId: bigint,
) =>
  client.worker.findFirst({
    where: {
      id: workerId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

const toAvailability = (availability: PrismaWorkerAvailableTime): Availability => ({
  id: toApiId(availability.id),
  workerId: toApiId(availability.workerId),
  availableDate: dateToDateString(availability.availableDate),
  startsAt: availability.startsAt.toISOString(),
  endsAt: availability.endsAt.toISOString(),
});

export async function listAvailability(
  prisma: PrismaClient,
  userId: string,
  query: AvailabilityQuery,
): Promise<AvailabilityListResponse> {
  const organizationId = await findOrganizationIdByUserId(prisma, userId);
  const workerId = toPrismaId(query.workerId);
  const worker = await findWorkerByOrganization(prisma, organizationId, workerId);

  if (!worker) {
    throw new HttpError(404, ERROR_CODES.WORKER_NOT_FOUND, "근무자를 찾을 수 없습니다.");
  }

  const items = await prisma.workerAvailableTime.findMany({
    where: {
      workerId,
      availableDate: {
        gte: dateStringToDate(query.startDate),
        lte: dateStringToDate(query.endDate),
      },
    },
    orderBy: [{ availableDate: "asc" }, { startsAt: "asc" }],
  });

  return {
    items: items.map(toAvailability),
  };
}
