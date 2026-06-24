import { Router } from "express";

import { authRoutes } from "@/routes/auth.routes";
import { organizationRoutes } from "@/routes/organization.routes";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/organization", organizationRoutes);
