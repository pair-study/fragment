import { availabilityQuerySchema, replaceAvailabilityRequestSchema } from "@fragment/shared";
import { Router } from "express";
import { z } from "zod";

import { createRequireAuth } from "@/middlewares/require-auth";
import { validate } from "@/middlewares/validate";
import { verifyAccessToken } from "@/modules/auth/auth.tokens";
import {
  listAvailabilityHandler,
  replaceAvailabilityHandler,
} from "@/modules/availability/availability.handlers";

export const availabilityRoutes = Router();
const requireAuth = createRequireAuth({ verifyAccessToken });

availabilityRoutes.get(
  "/",
  requireAuth,
  validate(
    z.object({
      query: availabilityQuerySchema,
    }),
  ),
  listAvailabilityHandler,
);

availabilityRoutes.put(
  "/bulk",
  requireAuth,
  validate(
    z.object({
      body: replaceAvailabilityRequestSchema,
    }),
  ),
  replaceAvailabilityHandler,
);
