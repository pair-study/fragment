import type { PrismaClient } from "@fragment/database";
import type { DashboardResponse } from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { toOrganizationDetail } from "@/modules/organization/organization.service";
import { scheduleDetailInclude, toScheduleDetail } from "@/modules/schedules/schedules.mapper";
import { toPrismaId } from "@/utils/mapper";

export async function getDashboard(
  prisma: PrismaClient,
  organizationId: string,
): Promise<DashboardResponse> {
  const organizationDatabaseId = toPrismaId(organizationId);
  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationDatabaseId,
    },
    include: {
      businessHours: true,
    },
  });

  if (!organization) {
    throw new HttpError(404, ERROR_CODES.NOT_FOUND, "조직을 찾을 수 없습니다.");
  }

  const latestConfirmedSchedule = await prisma.schedule.findFirst({
    where: {
      organizationId: organizationDatabaseId,
      status: "CONFIRMED",
    },
    orderBy: [{ confirmedAt: "desc" }, { id: "desc" }],
    include: scheduleDetailInclude,
  });

  return {
    organization: toOrganizationDetail(organization),
    latestConfirmedSchedule: latestConfirmedSchedule
      ? toScheduleDetail(latestConfirmedSchedule)
      : null,
  };
}
