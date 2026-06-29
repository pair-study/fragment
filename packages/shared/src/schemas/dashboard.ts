import { z } from "zod";
import { organizationSummarySchema } from "./organization";
import { scheduleDetailSchema } from "./schedules";

export const dashboardResponseSchema = z.object({
  organization: organizationSummarySchema,
  latestConfirmedSchedule: scheduleDetailSchema.nullable(),
});
