import { z } from "zod";
import { organizationDetailSchema } from "./organization";
import { scheduleDetailSchema } from "./schedules";

export const dashboardResponseSchema = z.object({
  organization: organizationDetailSchema,
  latestConfirmedSchedule: scheduleDetailSchema.nullable(),
});
