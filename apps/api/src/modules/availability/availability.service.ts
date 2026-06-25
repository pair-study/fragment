import type {
  DayOfWeek,
  OrganizationBusinessHour,
  Prisma,
  PrismaClient,
  WorkerAvailableTime as PrismaWorkerAvailableTime,
} from "@fragment/database";
import { DAY_OF_WEEK_VALUES } from "@fragment/shared";
import type {
  Availability,
  AvailabilityListResponse,
  AvailabilityQuery,
  ReplaceAvailabilityRequest,
} from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { toApiId, toPrismaId } from "@/utils/mapper";

type AvailabilityDatabaseClient = PrismaClient | Prisma.TransactionClient;

type OrganizationForAvailability = {
  id: bigint;
  businessHours: OrganizationBusinessHour[];
};

const dateStringToDate = (date: string) => new Date(`${date}T00:00:00.000Z`);

const dateTimeStringToDate = (dateTime: string) => new Date(dateTime);

const dateToDateString = (date: Date) => date.toISOString().slice(0, 10);

const getDayOfWeek = (date: Date): DayOfWeek => {
  const sundayFirstDay = date.getUTCDay();
  const mondayFirstDay = sundayFirstDay === 0 ? 6 : sundayFirstDay - 1;

  return DAY_OF_WEEK_VALUES[mondayFirstDay];
};

const addDays = (date: Date, days: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

const createDateTimeOnDate = (date: Date, time: Date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      time.getUTCHours(),
      time.getUTCMinutes(),
      0,
    ),
  );

const createInvalidTimeRangeError = () =>
  new HttpError(400, ERROR_CODES.INVALID_TIME_RANGE, "가능 시간이 조직 운영시간을 벗어났습니다.");

const createClosedDayError = () =>
  new HttpError(400, ERROR_CODES.CLOSED_DAY, "휴무일에는 가능 시간을 저장할 수 없습니다.");

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

const assertAvailabilityItemInBusinessHours = (
  organization: OrganizationForAvailability,
  input: ReplaceAvailabilityRequest,
) => {
  for (const item of input.items) {
    if (item.availableDate < input.startDate || item.availableDate > input.endDate) {
      throw createInvalidTimeRangeError();
    }

    const availableDate = dateStringToDate(item.availableDate);
    const businessHour = organization.businessHours.find(
      (currentBusinessHour) => currentBusinessHour.dayOfWeek === getDayOfWeek(availableDate),
    );

    if (
      !businessHour ||
      businessHour.isClosed ||
      !businessHour.openTime ||
      !businessHour.closeTime
    ) {
      throw createClosedDayError();
    }

    const startsAt = dateTimeStringToDate(item.startsAt);
    const endsAt = dateTimeStringToDate(item.endsAt);
    const openAt = createDateTimeOnDate(availableDate, businessHour.openTime);
    const closeDate = businessHour.closesNextDay ? addDays(availableDate, 1) : availableDate;
    const closeAt = createDateTimeOnDate(closeDate, businessHour.closeTime);

    if (startsAt < openAt || endsAt > closeAt) {
      throw createInvalidTimeRangeError();
    }
  }
};

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

  assertAvailabilityItemInBusinessHours(organization, input);

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

    if (input.items.length > 0) {
      await transaction.workerAvailableTime.createMany({
        data: input.items.map((item) => ({
          workerId,
          availableDate: dateStringToDate(item.availableDate),
          startsAt: dateTimeStringToDate(item.startsAt),
          endsAt: dateTimeStringToDate(item.endsAt),
        })),
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
