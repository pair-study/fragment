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
      if (value.openTime !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "휴무일에는 운영 시작 시간을 입력할 수 없습니다.",
          path: ["openTime"],
        });
      }

      if (value.closeTime !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "휴무일에는 운영 종료 시간을 입력할 수 없습니다.",
          path: ["closeTime"],
        });
      }

      if (value.closesNextDay) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "휴무일에는 익일 종료를 설정할 수 없습니다.",
          path: ["closesNextDay"],
        });
      }

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
      return;
    }

    if (
      value.openTime &&
      value.closeTime &&
      !value.closesNextDay &&
      value.openTime > value.closeTime
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "당일 종료는 시작 시간보다 늦어야 합니다.",
        path: ["closeTime"],
      });
    }

    if (
      value.openTime &&
      value.closeTime &&
      value.closesNextDay &&
      value.openTime < value.closeTime
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "익일 종료는 시작 시간보다 이른 시각이어야 합니다.",
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

const organizationBusinessHoursInputSchema = z
  .array(organizationBusinessHourInputSchema)
  .min(1)
  .refine(
    (businessHours) =>
      new Set(businessHours.map((businessHour) => businessHour.dayOfWeek)).size ===
      businessHours.length,
    {
      message: "요일별 운영 시간은 같은 요일을 중복 입력할 수 없습니다.",
    },
  );

export const createOrganizationRequestSchema = z.object({
  name: z.string().min(1),
  businessHours: organizationBusinessHoursInputSchema,
});

export const updateOrganizationRequestSchema = createOrganizationRequestSchema
  .partial()
  .refine((value) => value.name !== undefined || value.businessHours !== undefined, {
    message: "수정할 값을 하나 이상 입력해야 합니다.",
  });
