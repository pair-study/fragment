import { Router } from "express";

import { authRoutes } from "./auth.routes";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
