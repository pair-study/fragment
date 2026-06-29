import { Router } from "express";
import {
  createOrganizationRequestSchema,
  updateOrganizationRequestSchema,
  upsertActiveSchedulePlanningPeriodRequestSchema,
} from "@fragment/shared";
import { z } from "zod";

import { createRequireAuth } from "@/middlewares/require-auth";
import { validate } from "@/middlewares/validate";
import { verifyAccessToken } from "@/modules/auth/auth.tokens";
import {
  createOrganizationHandler,
  getOrganizationHandler,
  updateOrganizationHandler,
} from "@/modules/organization/organization.handlers";
import {
  deleteActiveSchedulePlanningPeriodHandler,
  getActiveSchedulePlanningPeriodHandler,
  upsertActiveSchedulePlanningPeriodHandler,
} from "@/modules/organization/planning-period.handlers";

export const organizationRoutes = Router();
const requireAuth = createRequireAuth({ verifyAccessToken });

organizationRoutes.post(
  "/",
  requireAuth,
  validate(
    z.object({
      body: createOrganizationRequestSchema,
    }),
  ),
  createOrganizationHandler,
);

organizationRoutes.get("/", requireAuth, getOrganizationHandler);

organizationRoutes.get(
  "/active-schedule-planning-period",
  requireAuth,
  getActiveSchedulePlanningPeriodHandler,
);

organizationRoutes.put(
  "/active-schedule-planning-period",
  requireAuth,
  validate(
    z.object({
      body: upsertActiveSchedulePlanningPeriodRequestSchema,
    }),
  ),
  upsertActiveSchedulePlanningPeriodHandler,
);

organizationRoutes.delete(
  "/active-schedule-planning-period",
  requireAuth,
  deleteActiveSchedulePlanningPeriodHandler,
);

organizationRoutes.patch(
  "/",
  requireAuth,
  validate(
    z.object({
      body: updateOrganizationRequestSchema,
    }),
  ),
  updateOrganizationHandler,
);
