import { Router } from "express";
import { authLoginRequestSchema, authSignupRequestSchema } from "@fragment/shared";
import { z } from "zod";

import { createRequireAuth } from "../middlewares/require-auth";
import { validate } from "../middlewares/validate";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  signupHandler,
} from "../modules/auth/auth.handlers";
import { verifyAccessToken } from "../modules/auth/auth.tokens";

export const authRoutes = Router();
const requireAuth = createRequireAuth({ verifyAccessToken });

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

authRoutes.post("/logout", logoutHandler);
authRoutes.get("/me", requireAuth, meHandler);
