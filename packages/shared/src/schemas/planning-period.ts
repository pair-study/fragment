import { z } from "zod";
import { dateSchema, dateRangeSchema, idSchema } from "./common";

export const activeSchedulePlanningPeriodSchema = z.object({
  id: idSchema,
  startDate: dateSchema,
  endDate: dateSchema,
});

export const upsertActiveSchedulePlanningPeriodRequestSchema = dateRangeSchema;

export const activeSchedulePlanningPeriodResponseSchema = z.object({
  period: activeSchedulePlanningPeriodSchema.nullable(),
});
