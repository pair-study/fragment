import { Prisma, type DayOfWeek, type PrismaClient } from "@fragment/database";
import type {
  CreateOrganizationRequest,
  OrganizationDetail,
  UpdateOrganizationRequest,
} from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { toApiId, toPrismaId } from "@/utils/mapper";

type OrganizationDatabaseClient = PrismaClient | Prisma.TransactionClient;

type OrganizationWithBusinessHours = Prisma.OrganizationGetPayload<{
  include: {
    businessHours: true;
  };
}>;

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

const toTimeDate = (time: string | null): Date | null => {
  if (time === null) {
    return null;
  }

  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
};

const toTimeString = (time: Date | null): string | null => {
  if (time === null) {
    return null;
  }

  const hour = String(time.getUTCHours()).padStart(2, "0");
  const minute = String(time.getUTCMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const getBusinessHourOrder = (dayOfWeek: DayOfWeek) => DAY_ORDER.indexOf(dayOfWeek);

const getClosesNextDay = ({
  closeTime,
  isClosed,
  openTime,
}: CreateOrganizationRequest["businessHours"][number]) =>
  !isClosed && openTime !== null && closeTime !== null && openTime > closeTime;

const toOrganizationDetail = (organization: OrganizationWithBusinessHours): OrganizationDetail => ({
  id: toApiId(organization.id),
  name: organization.name,
  businessHours: [...organization.businessHours]
    .sort((a, b) => getBusinessHourOrder(a.dayOfWeek) - getBusinessHourOrder(b.dayOfWeek))
    .map((businessHour) => ({
      id: toApiId(businessHour.id),
      dayOfWeek: businessHour.dayOfWeek,
      isClosed: businessHour.isClosed,
      openTime: toTimeString(businessHour.openTime),
      closeTime: toTimeString(businessHour.closeTime),
      closesNextDay: businessHour.closesNextDay,
    })),
});

const createBusinessHoursData = (businessHours: CreateOrganizationRequest["businessHours"]) =>
  businessHours.map((businessHour) => ({
    dayOfWeek: businessHour.dayOfWeek,
    isClosed: businessHour.isClosed,
    openTime: toTimeDate(businessHour.openTime),
    closeTime: toTimeDate(businessHour.closeTime),
    closesNextDay: getClosesNextDay(businessHour),
  }));

async function findOrganizationByUserId(client: OrganizationDatabaseClient, userId: bigint) {
  return client.organization.findUnique({
    where: { userId },
    include: {
      businessHours: true,
    },
  });
}

export async function createOrganization(
  prisma: PrismaClient,
  userId: string,
  input: CreateOrganizationRequest,
) {
  const userDatabaseId = toPrismaId(userId);

  const existingOrganization = await prisma.organization.findUnique({
    where: { userId: userDatabaseId },
    select: { id: true },
  });

  if (existingOrganization) {
    throw new HttpError(409, ERROR_CODES.ORGANIZATION_ALREADY_EXISTS, "이미 조직이 존재합니다.");
  }

  const organization = await prisma.organization.create({
    data: {
      userId: userDatabaseId,
      name: input.name,
      businessHours: {
        create: createBusinessHoursData(input.businessHours),
      },
    },
    include: {
      businessHours: true,
    },
  });

  return toOrganizationDetail(organization);
}

export async function getOrganization(prisma: PrismaClient, userId: string) {
  const organization = await findOrganizationByUserId(prisma, toPrismaId(userId));

  if (!organization) {
    throw new HttpError(404, ERROR_CODES.NOT_FOUND, "조직을 찾을 수 없습니다.");
  }

  return toOrganizationDetail(organization);
}

export async function updateOrganization(
  prisma: PrismaClient,
  userId: string,
  input: UpdateOrganizationRequest,
) {
  const userDatabaseId = toPrismaId(userId);

  return prisma.$transaction(async (transaction) => {
    const organization = await findOrganizationByUserId(transaction, userDatabaseId);

    if (!organization) {
      throw new HttpError(404, ERROR_CODES.NOT_FOUND, "조직을 찾을 수 없습니다.");
    }

    if (input.businessHours) {
      await transaction.organizationBusinessHour.deleteMany({
        where: { organizationId: organization.id },
      });
    }

    const updatedOrganization = await transaction.organization.update({
      where: { id: organization.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.businessHours
          ? {
              businessHours: {
                create: createBusinessHoursData(input.businessHours),
              },
            }
          : {}),
      },
      include: {
        businessHours: true,
      },
    });

    return toOrganizationDetail(updatedOrganization);
  });
}
