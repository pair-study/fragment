import type { PrismaClient } from "@fragment/database";
import { Router } from "express";

import { createRequireAuth } from "@/middlewares/require-auth";
import { createRequireOrganization } from "@/middlewares/require-organization";
import { verifyAccessToken } from "@/modules/auth/auth.tokens";
import { getDashboardHandler } from "@/modules/dashboard/dashboard.handlers";

export const dashboardRoutes = Router();
const requireAuth = createRequireAuth({ verifyAccessToken });

dashboardRoutes.use(requireAuth);
dashboardRoutes.use((req, res, next) => {
  const requireOrganization = createRequireOrganization({
    prisma: req.app.locals.prisma as PrismaClient,
  });

  return requireOrganization(req, res, next);
});

dashboardRoutes.get("/", getDashboardHandler);
