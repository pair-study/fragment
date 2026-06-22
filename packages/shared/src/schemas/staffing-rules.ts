import { z } from "zod";
import { dayOfWeekSchema, idSchema, timeSchema } from "./common";

export const minimumStaffingRuleSchema = z.object({
  id: idSchema,
  dayOfWeek: dayOfWeekSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  endsNextDay: z.boolean(),
  requiredCount: z.number().int().min(1),
});

const minimumStaffingRuleInputBaseSchema = minimumStaffingRuleSchema.omit({ id: true });

export const minimumStaffingRuleInputSchema = minimumStaffingRuleInputBaseSchema.refine(
  (value) => value.startTime !== value.endTime,
  {
    message: "시작 시간과 종료 시간은 같을 수 없습니다.",
    path: ["endTime"],
  },
);

export const createMinimumStaffingRuleRequestSchema = minimumStaffingRuleInputSchema;

export const updateMinimumStaffingRuleRequestSchema = minimumStaffingRuleInputBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 값을 하나 이상 입력해야 합니다.",
  });

export const minimumStaffingRulesListResponseSchema = z.object({
  items: z.array(minimumStaffingRuleSchema),
});
