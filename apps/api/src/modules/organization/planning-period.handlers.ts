import type { PrismaClient } from "@fragment/database";
import type { Request, RequestHandler } from "express";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import {
  deleteActiveSchedulePlanningPeriod,
  getActiveSchedulePlanningPeriod,
  upsertActiveSchedulePlanningPeriod,
} from "./planning-period.service";

const getAuthenticatedUserId = (req: Request) => {
  if (!req.user) {
    throw new HttpError(401, ERROR_CODES.UNAUTHORIZED, "인증이 필요합니다.");
  }

  return req.user.id;
};

export const getActiveSchedulePlanningPeriodHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await getActiveSchedulePlanningPeriod(prisma, getAuthenticatedUserId(req));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const upsertActiveSchedulePlanningPeriodHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await upsertActiveSchedulePlanningPeriod(
      prisma,
      getAuthenticatedUserId(req),
      req.body,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteActiveSchedulePlanningPeriodHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;

    await deleteActiveSchedulePlanningPeriod(prisma, getAuthenticatedUserId(req));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
