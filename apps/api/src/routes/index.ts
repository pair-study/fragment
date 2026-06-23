import { Router } from "express";

import { authRoutes } from "@/routes/auth.routes";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
