import type {
  MinimumStaffingRule as PrismaMinimumStaffingRule,
  OrganizationBusinessHour,
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
import { pruneOrganizationAvailabilityForActivePlanningPeriod } from "@/modules/availability/availability.service";
import { dateToTimeString, parseTimeToMinutes, timeStringToDate } from "@/utils/date-time";
import { toApiId, toPrismaId } from "@/utils/mapper";

const MINUTES_IN_DAY = 24 * 60;

type StaffingRulesOrganization = {
  businessHours: OrganizationBusinessHour[];
  id: bigint;
};

const createMinimumStaffingRuleNotFoundError = () =>
  new HttpError(404, ERROR_CODES.NOT_FOUND, "최소 인원 조건을 찾을 수 없습니다.");

const createMinimumStaffingRuleValidationError = () =>
  new HttpError(400, ERROR_CODES.VALIDATION_ERROR, "요청 형식이 올바르지 않습니다.");

const createMinimumStaffingRuleClosedDayError = () =>
  new HttpError(400, ERROR_CODES.CLOSED_DAY, "휴무일에는 최소 인원 조건을 등록할 수 없습니다.");

const createMinimumStaffingRuleOutsideBusinessHoursError = () =>
  new HttpError(
    400,
    ERROR_CODES.INVALID_TIME_RANGE,
    "최소 인원 조건은 조직 운영시간 안에서만 등록할 수 있습니다.",
  );

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

const dateToMinutes = (time: Date) => parseTimeToMinutes(dateToTimeString(time));

const getRangeEndMinutes = (endTime: string, endsNextDay: boolean) => {
  const rawEndMinutes = parseTimeToMinutes(endTime);

  return endsNextDay ? rawEndMinutes + MINUTES_IN_DAY : rawEndMinutes;
};

const assertMinimumStaffingRuleInsideBusinessHours = ({
  businessHours,
  dayOfWeek,
  endTime,
  endsNextDay,
  startTime,
}: Pick<MinimumStaffingRule, "dayOfWeek" | "endTime" | "endsNextDay" | "startTime"> & {
  businessHours: OrganizationBusinessHour[];
}) => {
  const businessHour = businessHours.find((item) => item.dayOfWeek === dayOfWeek);

  if (
    !businessHour ||
    businessHour.isClosed ||
    !businessHour.openTime ||
    !businessHour.closeTime
  ) {
    throw createMinimumStaffingRuleClosedDayError();
  }

  const businessStartMinutes = dateToMinutes(businessHour.openTime);
  const rawBusinessEndMinutes = dateToMinutes(businessHour.closeTime);
  const businessEndMinutes = businessHour.closesNextDay
    ? rawBusinessEndMinutes + MINUTES_IN_DAY
    : rawBusinessEndMinutes;
  const ruleStartMinutes = parseTimeToMinutes(startTime);
  const ruleEndMinutes = getRangeEndMinutes(endTime, endsNextDay);

  if (ruleStartMinutes < businessStartMinutes || ruleEndMinutes > businessEndMinutes) {
    throw createMinimumStaffingRuleOutsideBusinessHoursError();
  }
};

const findOrganizationByUserId = async (
  prisma: PrismaClient,
  userId: string,
): Promise<StaffingRulesOrganization> => {
  const organization = await prisma.organization.findUnique({
    where: {
      userId: toPrismaId(userId),
    },
    select: {
      businessHours: true,
      id: true,
    },
  });

  if (!organization) {
    throw new HttpError(403, ERROR_CODES.ORGANIZATION_REQUIRED, "조직 생성 후 이용할 수 있습니다.");
  }

  return organization;
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
  const organization = await findOrganizationByUserId(prisma, userId);

  const rules = await prisma.minimumStaffingRule.findMany({
    where: {
      organizationId: organization.id,
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
  const organization = await findOrganizationByUserId(prisma, userId);

  assertMinimumStaffingRuleTimeRange(input);
  assertMinimumStaffingRuleInsideBusinessHours({
    businessHours: organization.businessHours,
    ...input,
  });

  const rule = await prisma.minimumStaffingRule.create({
    data: createMinimumStaffingRuleData(organization.id, input),
  });

  await pruneOrganizationAvailabilityForActivePlanningPeriod(prisma, organization.id);

  return toMinimumStaffingRule(rule);
}

export async function updateMinimumStaffingRule(
  prisma: PrismaClient,
  userId: string,
  ruleId: string,
  input: UpdateMinimumStaffingRuleRequest,
): Promise<MinimumStaffingRule> {
  const organization = await findOrganizationByUserId(prisma, userId);
  const ruleDatabaseId = toPrismaId(ruleId);

  const existingRule = await prisma.minimumStaffingRule.findFirst({
    where: {
      id: ruleDatabaseId,
      organizationId: organization.id,
    },
    select: {
      dayOfWeek: true,
      endTime: true,
      endsNextDay: true,
      id: true,
      startTime: true,
    },
  });

  if (!existingRule) {
    throw createMinimumStaffingRuleNotFoundError();
  }

  const mergedRule = {
    dayOfWeek: input.dayOfWeek ?? existingRule.dayOfWeek,
    startTime: input.startTime ?? dateToTimeString(existingRule.startTime),
    endTime: input.endTime ?? dateToTimeString(existingRule.endTime),
    endsNextDay: input.endsNextDay ?? existingRule.endsNextDay,
  };

  assertMinimumStaffingRuleTimeRange(mergedRule);
  assertMinimumStaffingRuleInsideBusinessHours({
    businessHours: organization.businessHours,
    ...mergedRule,
  });

  const updatedRule = await prisma.minimumStaffingRule.update({
    where: {
      id: existingRule.id,
    },
    data: createMinimumStaffingRuleUpdateData(input),
  });

  await pruneOrganizationAvailabilityForActivePlanningPeriod(prisma, organization.id);

  return toMinimumStaffingRule(updatedRule);
}

export async function deleteMinimumStaffingRule(
  prisma: PrismaClient,
  userId: string,
  ruleId: string,
): Promise<void> {
  const organization = await findOrganizationByUserId(prisma, userId);
  const result = await prisma.minimumStaffingRule.deleteMany({
    where: {
      id: toPrismaId(ruleId),
      organizationId: organization.id,
    },
  });

  if (result.count === 0) {
    throw createMinimumStaffingRuleNotFoundError();
  }

  await pruneOrganizationAvailabilityForActivePlanningPeriod(prisma, organization.id);
}
