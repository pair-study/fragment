import type { PrismaClient } from "@fragment/database";
import type { Request, RequestHandler } from "express";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { createOrganization, getOrganization, updateOrganization } from "./organization.service";

const getAuthenticatedUserId = (req: Request) => {
  // requireAuth 이후 실행되지만, 타입 좁히기와 라우터 누락 방지를 위해 확인합니다.
  if (!req.user) {
    throw new HttpError(401, ERROR_CODES.UNAUTHORIZED, "인증이 필요합니다.");
  }

  return req.user.id;
};

export const createOrganizationHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await createOrganization(prisma, getAuthenticatedUserId(req), req.body);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getOrganizationHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await getOrganization(prisma, getAuthenticatedUserId(req));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await updateOrganization(prisma, getAuthenticatedUserId(req), req.body);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
