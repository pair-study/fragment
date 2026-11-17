import type { PrismaClient } from "@fragment/database";
import type { ScheduleHistoryQuery } from "@fragment/shared";
import type { Request, RequestHandler } from "express";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import {
  exportScheduleHistoryCsv,
  getScheduleHistoryDetail,
  listScheduleHistory,
} from "./schedule-history.service";

const getRequestOrganizationId = (req: Request) => {
  if (!req.organization) {
    throw new HttpError(403, ERROR_CODES.ORGANIZATION_REQUIRED, "조직 생성 후 이용할 수 있습니다.");
  }

  return req.organization.id;
};

const getScheduleIdParam = (req: Request) => {
  const scheduleId = req.params.scheduleId;

  if (typeof scheduleId !== "string") {
    throw new HttpError(400, ERROR_CODES.VALIDATION_ERROR, "요청 형식이 올바르지 않습니다.");
  }

  return scheduleId;
};

export const listScheduleHistoryHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await listScheduleHistory(
      prisma,
      getRequestOrganizationId(req),
      req.query as unknown as ScheduleHistoryQuery,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getScheduleHistoryDetailHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await getScheduleHistoryDetail(
      prisma,
      getRequestOrganizationId(req),
      getScheduleIdParam(req),
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const exportScheduleHistoryCsvHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const scheduleId = getScheduleIdParam(req);
    const result = await exportScheduleHistoryCsv(
      prisma,
      getRequestOrganizationId(req),
      scheduleId,
    );

    res
      .status(200)
      .type("text/csv; charset=utf-8")
      .set("Content-Disposition", `attachment; filename="schedule-${scheduleId}.csv"`)
      .send(result);
  } catch (error) {
    next(error);
  }
};
