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

type MinimumStaffingRuleTimeRangeInput = {
  startTime?: string;
  endTime?: string;
  endsNextDay?: boolean;
};

const addMinimumStaffingRuleTimeRangeIssues = (
  value: MinimumStaffingRuleTimeRangeInput,
  context: z.RefinementCtx,
) => {
  if (!value.startTime || !value.endTime) {
    return;
  }

  if (value.startTime === value.endTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "시작 시간과 종료 시간은 같을 수 없습니다.",
      path: ["endTime"],
    });
    return;
  }

  if (value.endsNextDay === undefined) {
    return;
  }

  if (!value.endsNextDay && value.startTime > value.endTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "당일 종료는 시작 시간보다 늦어야 합니다.",
      path: ["endTime"],
    });
  }

  if (value.endsNextDay && value.startTime < value.endTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "익일 종료는 시작 시간보다 이른 시각이어야 합니다.",
      path: ["endTime"],
    });
  }
};

export const minimumStaffingRuleInputSchema = minimumStaffingRuleInputBaseSchema.superRefine(
  addMinimumStaffingRuleTimeRangeIssues,
);

export const createMinimumStaffingRuleRequestSchema = minimumStaffingRuleInputSchema;

export const updateMinimumStaffingRuleRequestSchema = minimumStaffingRuleInputBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 값을 하나 이상 입력해야 합니다.",
  })
  .superRefine((value, context) => {
    addMinimumStaffingRuleTimeRangeIssues(value, context);
  });

export const minimumStaffingRulesListResponseSchema = z.object({
  items: z.array(minimumStaffingRuleSchema),
});
