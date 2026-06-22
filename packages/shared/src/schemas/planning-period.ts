import { z } from "zod";
import { dateSchema, dateRangeSchema, idSchema, isDateRangeOrdered } from "./common";

export const activeSchedulePlanningPeriodSchema = z
  .object({
    id: idSchema,
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine(isDateRangeOrdered, {
    message: "종료 날짜는 시작 날짜보다 빠를 수 없습니다.",
    path: ["endDate"],
  });

export const upsertActiveSchedulePlanningPeriodRequestSchema = dateRangeSchema;

export const activeSchedulePlanningPeriodResponseSchema = z.object({
  period: activeSchedulePlanningPeriodSchema.nullable(),
});
