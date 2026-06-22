import { z } from "zod";
import { dayOfWeekSchema, idSchema, timeSchema } from "./common";

export const organizationBusinessHourSchema = z.object({
  id: idSchema.optional(),
  dayOfWeek: dayOfWeekSchema,
  isClosed: z.boolean(),
  openTime: timeSchema.nullable(),
  closeTime: timeSchema.nullable(),
  closesNextDay: z.boolean(),
});

export const organizationBusinessHourInputSchema = organizationBusinessHourSchema
  .omit({ id: true })
  .superRefine((value, context) => {
    if (value.isClosed) {
      return;
    }

    if (!value.openTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "운영 시작 시간이 필요합니다.",
        path: ["openTime"],
      });
    }

    if (!value.closeTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "운영 종료 시간이 필요합니다.",
        path: ["closeTime"],
      });
    }

    if (value.openTime && value.closeTime && value.openTime === value.closeTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "운영 시작 시간과 종료 시간은 같을 수 없습니다.",
        path: ["closeTime"],
      });
    }
  });

export const organizationSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
});

export const organizationDetailSchema = organizationSummarySchema.extend({
  businessHours: z.array(organizationBusinessHourSchema),
});

export const createOrganizationRequestSchema = z.object({
  name: z.string().min(1),
  businessHours: z.array(organizationBusinessHourInputSchema).min(1),
});

export const updateOrganizationRequestSchema = createOrganizationRequestSchema
  .partial()
  .refine((value) => value.name !== undefined || value.businessHours !== undefined, {
    message: "수정할 값을 하나 이상 입력해야 합니다.",
  });
