import type { PrismaClient } from "@fragment/database";
import type { AvailabilityQuery } from "@fragment/shared";
import type { Request, RequestHandler } from "express";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { listAvailability } from "./availability.service";

const getAuthenticatedUserId = (req: Request) => {
  if (!req.user) {
    throw new HttpError(401, ERROR_CODES.UNAUTHORIZED, "인증이 필요합니다.");
  }

  return req.user.id;
};

export const listAvailabilityHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await listAvailability(
      prisma,
      getAuthenticatedUserId(req),
      req.query as AvailabilityQuery,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
