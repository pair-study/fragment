import { Router } from "express";
import { authLoginRequestSchema, authSignupRequestSchema } from "@fragment/shared";
import { z } from "zod";

import { createRequireAuth } from "../middlewares/require-auth";
import { createRequireSameOrigin } from "../middlewares/require-same-origin";
import { validate } from "../middlewares/validate";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  signupHandler,
} from "../modules/auth/auth.handlers";
import { verifyAccessToken } from "../modules/auth/auth.tokens";

export const authRoutes = Router();
const requireAuth = createRequireAuth({ verifyAccessToken });
const requireSameOrigin = createRequireSameOrigin(process.env.WEB_APP_ORIGIN);

authRoutes.post(
  "/signup",
  validate(
    z.object({
      body: authSignupRequestSchema,
    }),
  ),
  signupHandler,
);

authRoutes.post(
  "/login",
  validate(
    z.object({
      body: authLoginRequestSchema,
    }),
  ),
  loginHandler,
);

authRoutes.post("/logout", requireSameOrigin, logoutHandler);
authRoutes.post("/refresh", requireSameOrigin, refreshHandler);
authRoutes.get("/me", requireAuth, meHandler);
