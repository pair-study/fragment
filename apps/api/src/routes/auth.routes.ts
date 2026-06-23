import { Router } from "express";
import { authLoginRequestSchema, authSignupRequestSchema } from "@fragment/shared";
import { z } from "zod";

import { validate } from "../middlewares/validate";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  signupHandler,
} from "../modules/auth/auth.handlers";

export const authRoutes = Router();

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
authRoutes.get("/me", meHandler);
