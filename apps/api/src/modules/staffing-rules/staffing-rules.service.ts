import type { PrismaClient } from "@fragment/database";
import type {
  CreateMinimumStaffingRuleRequest,
  MinimumStaffingRule,
  MinimumStaffingRulesListResponse,
  UpdateMinimumStaffingRuleRequest,
} from "@fragment/shared";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";

const createNotImplementedError = () =>
  new HttpError(
    500,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    "최소 인원 조건 API가 구현되지 않았습니다.",
  );

export async function getMinimumStaffingRules(
  prisma: PrismaClient,
  userId: string,
): Promise<MinimumStaffingRulesListResponse> {
  void prisma;
  void userId;

  throw createNotImplementedError();
}

export async function createMinimumStaffingRule(
  prisma: PrismaClient,
  userId: string,
  input: CreateMinimumStaffingRuleRequest,
): Promise<MinimumStaffingRule> {
  void prisma;
  void userId;
  void input;

  throw createNotImplementedError();
}

export async function updateMinimumStaffingRule(
  prisma: PrismaClient,
  userId: string,
  ruleId: string,
  input: UpdateMinimumStaffingRuleRequest,
): Promise<MinimumStaffingRule> {
  void prisma;
  void userId;
  void ruleId;
  void input;

  throw createNotImplementedError();
}

export async function deleteMinimumStaffingRule(
  prisma: PrismaClient,
  userId: string,
  ruleId: string,
): Promise<void> {
  void prisma;
  void userId;
  void ruleId;

  throw createNotImplementedError();
}
