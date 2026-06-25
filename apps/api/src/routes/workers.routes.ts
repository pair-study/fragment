import {
  createWorkerRequestSchema,
  updateWorkerRequestSchema,
  workerIdParamsSchema,
} from "@fragment/shared";
import { Router } from "express";
import { z } from "zod";

import { createRequireAuth } from "@/middlewares/require-auth";
import { createRequireOrganization } from "@/middlewares/require-organization";
import { validate } from "@/middlewares/validate";
import { verifyAccessToken } from "@/modules/auth/auth.tokens";
import {
  createWorkerHandler,
  deleteWorkerHandler,
  listWorkersHandler,
  updateWorkerHandler,
} from "@/modules/workers/workers.handlers";
import type { PrismaClient } from "@fragment/database";

export const workersRoutes = Router();
const requireAuth = createRequireAuth({ verifyAccessToken });

workersRoutes.use(requireAuth);
workersRoutes.use((req, res, next) => {
  const requireOrganization = createRequireOrganization({
    prisma: req.app.locals.prisma as PrismaClient,
  });

  return requireOrganization(req, res, next);
});

workersRoutes.get("/", listWorkersHandler);

workersRoutes.post(
  "/",
  validate(
    z.object({
      body: createWorkerRequestSchema,
    }),
  ),
  createWorkerHandler,
);

workersRoutes.patch(
  "/:workerId",
  validate(
    z.object({
      params: workerIdParamsSchema,
      body: updateWorkerRequestSchema,
    }),
  ),
  updateWorkerHandler,
);

workersRoutes.delete(
  "/:workerId",
  validate(
    z.object({
      params: workerIdParamsSchema,
    }),
  ),
  deleteWorkerHandler,
);
