import { Router } from "express";
import { createOrganizationRequestSchema, updateOrganizationRequestSchema } from "@fragment/shared";
import { z } from "zod";

import { createRequireAuth } from "@/middlewares/require-auth";
import { validate } from "@/middlewares/validate";
import { verifyAccessToken } from "@/modules/auth/auth.tokens";
import {
  createOrganizationHandler,
  getOrganizationHandler,
  updateOrganizationHandler,
} from "@/modules/organization/organization.handlers";

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
