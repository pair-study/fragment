import {
  draftScheduleQuerySchema,
  idSchema,
  recommendScheduleRequestSchema,
  scheduleAssignmentInputSchema,
  updateScheduleAssignmentRequestSchema,
} from "@fragment/shared";
import type { PrismaClient } from "@fragment/database";
import { Router } from "express";
import { z } from "zod";

import { createRequireAuth } from "@/middlewares/require-auth";
import { createRequireOrganization } from "@/middlewares/require-organization";
import { validate } from "@/middlewares/validate";
import { verifyAccessToken } from "@/modules/auth/auth.tokens";
import {
  confirmScheduleHandler,
  createScheduleAssignmentHandler,
  deleteScheduleAssignmentHandler,
  getDraftScheduleHandler,
  recommendScheduleHandler,
  updateScheduleAssignmentHandler,
} from "@/modules/schedules/schedules.handlers";

const scheduleIdParamsSchema = z.object({
  scheduleId: idSchema,
});

const assignmentParamsSchema = scheduleIdParamsSchema.extend({
  assignmentId: idSchema,
});

export const schedulesRoutes = Router();
const requireAuth = createRequireAuth({ verifyAccessToken });

schedulesRoutes.use(requireAuth);
schedulesRoutes.use((req, res, next) => {
  const requireOrganization = createRequireOrganization({
    prisma: req.app.locals.prisma as PrismaClient,
  });

  return requireOrganization(req, res, next);
});

schedulesRoutes.post(
  "/recommend",
  validate(
    z.object({
      body: recommendScheduleRequestSchema,
    }),
  ),
  recommendScheduleHandler,
);

schedulesRoutes.get(
  "/draft",
  validate(
    z.object({
      query: draftScheduleQuerySchema,
    }),
  ),
  getDraftScheduleHandler,
);

schedulesRoutes.post(
  "/:scheduleId/assignments",
  validate(
    z.object({
      params: scheduleIdParamsSchema,
      body: scheduleAssignmentInputSchema,
    }),
  ),
  createScheduleAssignmentHandler,
);

schedulesRoutes.patch(
  "/:scheduleId/assignments/:assignmentId",
  validate(
    z.object({
      params: assignmentParamsSchema,
      body: updateScheduleAssignmentRequestSchema,
    }),
  ),
  updateScheduleAssignmentHandler,
);

schedulesRoutes.delete(
  "/:scheduleId/assignments/:assignmentId",
  validate(
    z.object({
      params: assignmentParamsSchema,
    }),
  ),
  deleteScheduleAssignmentHandler,
);

schedulesRoutes.post(
  "/:scheduleId/confirm",
  validate(
    z.object({
      params: scheduleIdParamsSchema,
    }),
  ),
  confirmScheduleHandler,
);
