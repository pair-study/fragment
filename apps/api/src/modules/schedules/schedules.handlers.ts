import type { PrismaClient } from "@fragment/database";
import type { DraftScheduleQuery } from "@fragment/shared";
import type { Request, RequestHandler } from "express";

import { ERROR_CODES } from "@/common/constants/error-codes";
import { HttpError } from "@/errors/http-error";
import {
  confirmSchedule,
  createScheduleAssignment,
  deleteScheduleAssignment,
  getDraftSchedule,
  recommendSchedule,
  updateScheduleAssignment,
} from "./schedules.service";

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

const getAssignmentIdParam = (req: Request) => {
  const assignmentId = req.params.assignmentId;

  if (typeof assignmentId !== "string") {
    throw new HttpError(400, ERROR_CODES.VALIDATION_ERROR, "요청 형식이 올바르지 않습니다.");
  }

  return assignmentId;
};

export const recommendScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await recommendSchedule(prisma, getRequestOrganizationId(req), req.body);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getDraftScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await getDraftSchedule(
      prisma,
      getRequestOrganizationId(req),
      req.query as DraftScheduleQuery,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createScheduleAssignmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await createScheduleAssignment(
      prisma,
      getRequestOrganizationId(req),
      getScheduleIdParam(req),
      req.body,
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateScheduleAssignmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await updateScheduleAssignment(
      prisma,
      getRequestOrganizationId(req),
      getScheduleIdParam(req),
      getAssignmentIdParam(req),
      req.body,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteScheduleAssignmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;

    await deleteScheduleAssignment(
      prisma,
      getRequestOrganizationId(req),
      getScheduleIdParam(req),
      getAssignmentIdParam(req),
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const confirmScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    const result = await confirmSchedule(
      prisma,
      getRequestOrganizationId(req),
      getScheduleIdParam(req),
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
