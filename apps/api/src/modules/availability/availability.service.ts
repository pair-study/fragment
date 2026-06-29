import type {
  Prisma,
  PrismaClient,
  WorkerAvailableTime as PrismaWorkerAvailableTime,
} from "@fragment/database";
import type {
  Availability,
  AvailabilityListResponse,
  AvailabilityQuery,
  ReplaceAvailabilityRequest,
} from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import {
  pruneAvailabilityTimesToSchedulableRanges,
  type PrunedAvailabilityTime,
} from "@/modules/scheduling-time-policy";
import {
  dateStringToDate,
  dateTimeStringToDate,
  dateToDateString,
} from "@/utils/date-time";
import { toApiId, toPrismaId } from "@/utils/mapper";

type AvailabilityDatabaseClient = PrismaClient | Prisma.TransactionClient;

type OrganizationForAvailability = Prisma.OrganizationGetPayload<{
  include: { businessHours: true; minimumStaffingRules: true };
}>;

const createInvalidTimeRangeError = () =>
  new HttpError(400, ERROR_CODES.INVALID_TIME_RANGE, "가능 시간이 조직 운영시간을 벗어났습니다.");

const findOrganizationByUserId = async (
  prisma: PrismaClient,
  userId: string,
): Promise<OrganizationForAvailability> => {
  const organization = await prisma.organization.findUnique({
    where: {
      userId: toPrismaId(userId),
    },
    include: {
      businessHours: true,
      minimumStaffingRules: true,
    },
  });

  if (!organization) {
    throw new HttpError(403, ERROR_CODES.ORGANIZATION_REQUIRED, "조직 생성 후 이용할 수 있습니다.");
  }

  return organization;
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

const assertAvailabilityItemsInDateRange = (input: ReplaceAvailabilityRequest) => {
  for (const item of input.items) {
    if (item.availableDate < input.startDate || item.availableDate > input.endDate) {
      throw createInvalidTimeRangeError();
    }

    if (dateTimeStringToDate(item.startsAt) >= dateTimeStringToDate(item.endsAt)) {
      throw createInvalidTimeRangeError();
    }
  }
};

const createPrunedAvailabilityItems = (
  organization: OrganizationForAvailability,
  availableTimes: Pick<
    PrismaWorkerAvailableTime,
    "availableDate" | "endsAt" | "startsAt" | "workerId"
  >[],
): PrunedAvailabilityTime[] =>
  pruneAvailabilityTimesToSchedulableRanges({
    availableTimes,
    businessHours: organization.businessHours,
    rules: organization.minimumStaffingRules,
  });

export async function listAvailability(
  prisma: PrismaClient,
  userId: string,
  query: AvailabilityQuery,
): Promise<AvailabilityListResponse> {
  const organization = await findOrganizationByUserId(prisma, userId);
  const organizationId = organization.id;
  const workerId = toPrismaId(query.workerId);
  const worker = await findWorkerByOrganization(prisma, organizationId, workerId);

  if (!worker) {
    throw new HttpError(404, ERROR_CODES.WORKER_NOT_FOUND, "근무자를 찾을 수 없습니다.");
  }

  await pruneOrganizationAvailabilityForActivePlanningPeriod(prisma, organizationId);

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

export async function replaceAvailability(
  prisma: PrismaClient,
  userId: string,
  input: ReplaceAvailabilityRequest,
): Promise<AvailabilityListResponse> {
  const organization = await findOrganizationByUserId(prisma, userId);
  const organizationId = organization.id;
  const workerId = toPrismaId(input.workerId);
  const worker = await findWorkerByOrganization(prisma, organizationId, workerId);

  if (!worker) {
    throw new HttpError(404, ERROR_CODES.WORKER_NOT_FOUND, "근무자를 찾을 수 없습니다.");
  }

  assertAvailabilityItemsInDateRange(input);

  const prunedItems = createPrunedAvailabilityItems(
    organization,
    input.items.map((item) => ({
      workerId,
      availableDate: dateStringToDate(item.availableDate),
      startsAt: dateTimeStringToDate(item.startsAt),
      endsAt: dateTimeStringToDate(item.endsAt),
    })),
  );

  return prisma.$transaction(async (transaction) => {
    const dateRange = {
      gte: dateStringToDate(input.startDate),
      lte: dateStringToDate(input.endDate),
    };

    await transaction.workerAvailableTime.deleteMany({
      where: {
        workerId,
        availableDate: dateRange,
      },
    });

    if (prunedItems.length > 0) {
      await transaction.workerAvailableTime.createMany({
        data: prunedItems,
      });
    }

    const items = await transaction.workerAvailableTime.findMany({
      where: {
        workerId,
        availableDate: dateRange,
      },
      orderBy: [{ availableDate: "asc" }, { startsAt: "asc" }],
    });

    return {
      items: items.map(toAvailability),
    };
  });
}

export async function pruneOrganizationAvailabilityForActivePlanningPeriod(
  client: AvailabilityDatabaseClient,
  organizationId: bigint,
): Promise<void> {
  const activePeriod = await client.activeSchedulePlanningPeriod.findUnique({
    where: {
      organizationId,
    },
  });

  if (!activePeriod) {
    return;
  }

  const organization = await client.organization.findUnique({
    where: {
      id: organizationId,
    },
    include: {
      businessHours: true,
      minimumStaffingRules: true,
    },
  });

  if (!organization) {
    return;
  }

  const dateRange = {
    gte: activePeriod.startDate,
    lte: activePeriod.endDate,
  };
  const existingItems = await client.workerAvailableTime.findMany({
    where: {
      worker: {
        organizationId,
      },
      availableDate: dateRange,
    },
    orderBy: [{ availableDate: "asc" }, { startsAt: "asc" }],
  });
  const prunedItems = createPrunedAvailabilityItems(organization, existingItems);

  await client.workerAvailableTime.deleteMany({
    where: {
      worker: {
        organizationId,
      },
      availableDate: dateRange,
    },
  });

  if (prunedItems.length > 0) {
    await client.workerAvailableTime.createMany({
      data: prunedItems,
    });
  }
}
