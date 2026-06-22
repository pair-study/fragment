import { z } from "zod";
import { dateSchema, dateTimeSchema, idSchema } from "./common";
import { scheduleDetailSchema } from "./schedules";

export const scheduleHistoryQuerySchema = z.object({
  year: z.coerce.number().int().min(1900),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const scheduleHistoryItemSchema = z.object({
  id: idSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  confirmedAt: dateTimeSchema,
});

export const scheduleHistoryListResponseSchema = z.object({
  items: z.array(scheduleHistoryItemSchema),
});

export const scheduleHistoryDetailResponseSchema = scheduleDetailSchema;
