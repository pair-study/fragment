import {
  createMinimumStaffingRuleRequestSchema,
  idSchema,
  updateMinimumStaffingRuleRequestSchema,
} from "@fragment/shared";
import { Router } from "express";
import { z } from "zod";

import { createRequireAuth } from "@/middlewares/require-auth";
import { validate } from "@/middlewares/validate";
import { verifyAccessToken } from "@/modules/auth/auth.tokens";
import {
  createMinimumStaffingRuleHandler,
  deleteMinimumStaffingRuleHandler,
  getMinimumStaffingRulesHandler,
  updateMinimumStaffingRuleHandler,
} from "@/modules/staffing-rules/staffing-rules.handlers";

const ruleIdParamsSchema = z.object({
  ruleId: idSchema,
});

export const staffingRulesRoutes = Router();
const requireAuth = createRequireAuth({ verifyAccessToken });

staffingRulesRoutes.get("/", requireAuth, getMinimumStaffingRulesHandler);

staffingRulesRoutes.post(
  "/",
  requireAuth,
  validate(
    z.object({
      body: createMinimumStaffingRuleRequestSchema,
    }),
  ),
  createMinimumStaffingRuleHandler,
);

staffingRulesRoutes.patch(
  "/:ruleId",
  requireAuth,
  validate(
    z.object({
      params: ruleIdParamsSchema,
      body: updateMinimumStaffingRuleRequestSchema,
    }),
  ),
  updateMinimumStaffingRuleHandler,
);

staffingRulesRoutes.delete(
  "/:ruleId",
  requireAuth,
  validate(
    z.object({
      params: ruleIdParamsSchema,
    }),
  ),
  deleteMinimumStaffingRuleHandler,
);
