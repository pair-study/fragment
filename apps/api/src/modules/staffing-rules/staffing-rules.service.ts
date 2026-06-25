import type {
  MinimumStaffingRule as PrismaMinimumStaffingRule,
  Prisma,
  PrismaClient,
} from "@fragment/database";
import type {
  CreateMinimumStaffingRuleRequest,
  MinimumStaffingRule,
  MinimumStaffingRulesListResponse,
  UpdateMinimumStaffingRuleRequest,
} from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { dateToTimeString, timeStringToDate } from "@/utils/date-time";
import { toApiId, toPrismaId } from "@/utils/mapper";

const createMinimumStaffingRuleNotFoundError = () =>
  new HttpError(404, ERROR_CODES.NOT_FOUND, "최소 인원 조건을 찾을 수 없습니다.");

const createMinimumStaffingRuleValidationError = () =>
  new HttpError(400, ERROR_CODES.VALIDATION_ERROR, "요청 형식이 올바르지 않습니다.");

const assertMinimumStaffingRuleTimeRange = ({
  endTime,
  endsNextDay,
  startTime,
}: Pick<MinimumStaffingRule, "endTime" | "endsNextDay" | "startTime">) => {
  if (startTime === endTime) {
    throw createMinimumStaffingRuleValidationError();
  }

  if (!endsNextDay && startTime > endTime) {
    throw createMinimumStaffingRuleValidationError();
  }

  if (endsNextDay && startTime < endTime) {
    throw createMinimumStaffingRuleValidationError();
  }
};

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

export const toMinimumStaffingRule = (rule: PrismaMinimumStaffingRule): MinimumStaffingRule => ({
  id: toApiId(rule.id),
  dayOfWeek: rule.dayOfWeek,
  startTime: dateToTimeString(rule.startTime),
  endTime: dateToTimeString(rule.endTime),
  endsNextDay: rule.endsNextDay,
  requiredCount: rule.requiredCount,
});

const createMinimumStaffingRuleData = (
  organizationId: bigint,
  input: CreateMinimumStaffingRuleRequest,
): Prisma.MinimumStaffingRuleUncheckedCreateInput => ({
  organizationId,
  dayOfWeek: input.dayOfWeek,
  startTime: timeStringToDate(input.startTime),
  endTime: timeStringToDate(input.endTime),
  endsNextDay: input.endsNextDay,
  requiredCount: input.requiredCount,
});

const createMinimumStaffingRuleUpdateData = (
  input: UpdateMinimumStaffingRuleRequest,
): Prisma.MinimumStaffingRuleUncheckedUpdateInput => ({
  ...(input.dayOfWeek !== undefined ? { dayOfWeek: input.dayOfWeek } : {}),
  ...(input.startTime !== undefined ? { startTime: timeStringToDate(input.startTime) } : {}),
  ...(input.endTime !== undefined ? { endTime: timeStringToDate(input.endTime) } : {}),
  ...(input.endsNextDay !== undefined ? { endsNextDay: input.endsNextDay } : {}),
  ...(input.requiredCount !== undefined ? { requiredCount: input.requiredCount } : {}),
});

export async function getMinimumStaffingRules(
  prisma: PrismaClient,
  userId: string,
): Promise<MinimumStaffingRulesListResponse> {
  const organizationId = await findOrganizationIdByUserId(prisma, userId);

  const rules = await prisma.minimumStaffingRule.findMany({
    where: {
      organizationId,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return {
    items: rules.map(toMinimumStaffingRule),
  };
}

export async function createMinimumStaffingRule(
  prisma: PrismaClient,
  userId: string,
  input: CreateMinimumStaffingRuleRequest,
): Promise<MinimumStaffingRule> {
  const organizationId = await findOrganizationIdByUserId(prisma, userId);
  const rule = await prisma.minimumStaffingRule.create({
    data: createMinimumStaffingRuleData(organizationId, input),
  });

  return toMinimumStaffingRule(rule);
}

export async function updateMinimumStaffingRule(
  prisma: PrismaClient,
  userId: string,
  ruleId: string,
  input: UpdateMinimumStaffingRuleRequest,
): Promise<MinimumStaffingRule> {
  const organizationId = await findOrganizationIdByUserId(prisma, userId);
  const ruleDatabaseId = toPrismaId(ruleId);

  const existingRule = await prisma.minimumStaffingRule.findFirst({
    where: {
      id: ruleDatabaseId,
      organizationId,
    },
    select: {
      endTime: true,
      endsNextDay: true,
      id: true,
      startTime: true,
    },
  });

  if (!existingRule) {
    throw createMinimumStaffingRuleNotFoundError();
  }

  assertMinimumStaffingRuleTimeRange({
    startTime: input.startTime ?? dateToTimeString(existingRule.startTime),
    endTime: input.endTime ?? dateToTimeString(existingRule.endTime),
    endsNextDay: input.endsNextDay ?? existingRule.endsNextDay,
  });

  const updatedRule = await prisma.minimumStaffingRule.update({
    where: {
      id: existingRule.id,
    },
    data: createMinimumStaffingRuleUpdateData(input),
  });

  return toMinimumStaffingRule(updatedRule);
}

export async function deleteMinimumStaffingRule(
  prisma: PrismaClient,
  userId: string,
  ruleId: string,
): Promise<void> {
  const organizationId = await findOrganizationIdByUserId(prisma, userId);
  const result = await prisma.minimumStaffingRule.deleteMany({
    where: {
      id: toPrismaId(ruleId),
      organizationId,
    },
  });

  if (result.count === 0) {
    throw createMinimumStaffingRuleNotFoundError();
  }
}
