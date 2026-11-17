import { idSchema, scheduleHistoryQuerySchema } from "@fragment/shared";
import type { PrismaClient } from "@fragment/database";
import { Router } from "express";
import { z } from "zod";

import { createRequireAuth } from "@/middlewares/require-auth";
import { createRequireOrganization } from "@/middlewares/require-organization";
import { validate } from "@/middlewares/validate";
import { verifyAccessToken } from "@/modules/auth/auth.tokens";
import {
  exportScheduleHistoryCsvHandler,
  getScheduleHistoryDetailHandler,
  listScheduleHistoryHandler,
} from "@/modules/schedule-history/schedule-history.handlers";

const scheduleIdParamsSchema = z.object({
  scheduleId: idSchema,
});

export const scheduleHistoryRoutes = Router();
const requireAuth = createRequireAuth({ verifyAccessToken });

scheduleHistoryRoutes.use(requireAuth);
scheduleHistoryRoutes.use((req, res, next) => {
  const requireOrganization = createRequireOrganization({
    prisma: req.app.locals.prisma as PrismaClient,
  });

  return requireOrganization(req, res, next);
});

scheduleHistoryRoutes.get(
  "/",
  validate(
    z.object({
      query: scheduleHistoryQuerySchema,
    }),
  ),
  listScheduleHistoryHandler,
);

scheduleHistoryRoutes.get(
  "/:scheduleId/export.csv",
  validate(
    z.object({
      params: scheduleIdParamsSchema,
    }),
  ),
  exportScheduleHistoryCsvHandler,
);

scheduleHistoryRoutes.get(
  "/:scheduleId",
  validate(
    z.object({
      params: scheduleIdParamsSchema,
    }),
  ),
  getScheduleHistoryDetailHandler,
);
