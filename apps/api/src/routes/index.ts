import { Router } from "express";

import { availabilityRoutes } from "@/routes/availability.routes";
import { authRoutes } from "@/routes/auth.routes";
import { dashboardRoutes } from "@/routes/dashboard.routes";
import { organizationRoutes } from "@/routes/organization.routes";
import { scheduleHistoryRoutes } from "@/routes/schedule-history.routes";
import { schedulesRoutes } from "@/routes/schedules.routes";
import { staffingRulesRoutes } from "@/routes/staffing-rules.routes";
import { workersRoutes } from "@/routes/workers.routes";

export const apiRoutes = Router();

apiRoutes.use("/availability", availabilityRoutes);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/dashboard", dashboardRoutes);
apiRoutes.use("/organization", organizationRoutes);
apiRoutes.use("/schedule-history", scheduleHistoryRoutes);
apiRoutes.use("/schedules", schedulesRoutes);
apiRoutes.use("/staffing-rules", staffingRulesRoutes);
apiRoutes.use("/workers", workersRoutes);
