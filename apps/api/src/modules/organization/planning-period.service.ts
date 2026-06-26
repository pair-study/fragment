import type {
  ActiveSchedulePlanningPeriod as PrismaActiveSchedulePlanningPeriod,
  PrismaClient,
} from "@fragment/database";
import type {
  ActiveSchedulePlanningPeriod,
  ActiveSchedulePlanningPeriodResponse,
  UpsertActiveSchedulePlanningPeriodRequest,
} from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { toApiId, toPrismaId } from "@/utils/mapper";

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

const toActiveSchedulePlanningPeriod = (
  period: PrismaActiveSchedulePlanningPeriod,
): ActiveSchedulePlanningPeriod => ({
  id: toApiId(period.id),
  startDate: dateToDateString(period.startDate),
  endDate: dateToDateString(period.endDate),
});

export async function getActiveSchedulePlanningPeriod(
  prisma: PrismaClient,
  userId: string,
): Promise<ActiveSchedulePlanningPeriodResponse> {
  const organizationId = await findOrganizationIdByUserId(prisma, userId);
  const period = await prisma.activeSchedulePlanningPeriod.findUnique({
    where: {
      organizationId,
    },
  });

  return {
    period: period ? toActiveSchedulePlanningPeriod(period) : null,
  };
}

export async function upsertActiveSchedulePlanningPeriod(
  prisma: PrismaClient,
  userId: string,
  input: UpsertActiveSchedulePlanningPeriodRequest,
): Promise<ActiveSchedulePlanningPeriod> {
  const organizationId = await findOrganizationIdByUserId(prisma, userId);
  const period = await prisma.activeSchedulePlanningPeriod.upsert({
    where: {
      organizationId,
    },
    create: {
      organizationId,
      startDate: dateStringToDate(input.startDate),
      endDate: dateStringToDate(input.endDate),
    },
    update: {
      startDate: dateStringToDate(input.startDate),
      endDate: dateStringToDate(input.endDate),
    },
  });

  return toActiveSchedulePlanningPeriod(period);
}

export async function deleteActiveSchedulePlanningPeriod(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const organizationId = await findOrganizationIdByUserId(prisma, userId);

  await prisma.activeSchedulePlanningPeriod.deleteMany({
    where: {
      organizationId,
    },
  });
}
