import type { PrismaClient } from "@fragment/database";
import type { Request, RequestHandler } from "express";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import { createWorker, deleteWorker, listWorkers, updateWorker } from "./workers.service";

const getRequestOrganizationId = (req: Request) => {
  // requireOrganization 이후 실행되지만, 타입 좁히기와 라우터 누락 방지를 위해 확인합니다.
  if (!req.organization) {
    throw new HttpError(403, ERROR_CODES.ORGANIZATION_REQUIRED, "조직 생성 후 이용할 수 있습니다.");
  }

  return req.organization.id;
};

const getWorkerIdParam = (req: Request) => {
  const workerId = req.params.workerId;

  if (typeof workerId !== "string") {
    throw new HttpError(400, ERROR_CODES.VALIDATION_ERROR, "요청 형식이 올바르지 않습니다.");
  }

  return workerId;
};

export const listWorkersHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await listWorkers(prisma, getRequestOrganizationId(req));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createWorkerHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await createWorker(prisma, getRequestOrganizationId(req), req.body);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateWorkerHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await updateWorker(
      prisma,
      getRequestOrganizationId(req),
      getWorkerIdParam(req),
      req.body,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteWorkerHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    await deleteWorker(prisma, getRequestOrganizationId(req), getWorkerIdParam(req));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
