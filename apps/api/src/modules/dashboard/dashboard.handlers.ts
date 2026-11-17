import type { PrismaClient } from "@fragment/database";
import type { Request, RequestHandler } from "express";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { getDashboard } from "./dashboard.service";

const getRequestOrganizationId = (req: Request) => {
  if (!req.organization) {
    throw new HttpError(403, ERROR_CODES.ORGANIZATION_REQUIRED, "조직 생성 후 이용할 수 있습니다.");
  }

  return req.organization.id;
};

export const getDashboardHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await getDashboard(prisma, getRequestOrganizationId(req));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
