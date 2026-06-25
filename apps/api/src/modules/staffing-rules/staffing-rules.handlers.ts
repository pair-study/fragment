import type { PrismaClient } from "@fragment/database";
import type { Request, RequestHandler } from "express";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import {
  createMinimumStaffingRule,
  deleteMinimumStaffingRule,
  getMinimumStaffingRules,
  updateMinimumStaffingRule,
} from "./staffing-rules.service";

const getAuthenticatedUserId = (req: Request) => {
  if (!req.user) {
    throw new HttpError(401, ERROR_CODES.UNAUTHORIZED, "인증이 필요합니다.");
  }

  return req.user.id;
};

export const getMinimumStaffingRulesHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await getMinimumStaffingRules(prisma, getAuthenticatedUserId(req));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createMinimumStaffingRuleHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await createMinimumStaffingRule(prisma, getAuthenticatedUserId(req), req.body);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateMinimumStaffingRuleHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const { ruleId } = req.params as { ruleId: string };
    const result = await updateMinimumStaffingRule(
      prisma,
      getAuthenticatedUserId(req),
      ruleId,
      req.body,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteMinimumStaffingRuleHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const { ruleId } = req.params as { ruleId: string };

    await deleteMinimumStaffingRule(prisma, getAuthenticatedUserId(req), ruleId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
