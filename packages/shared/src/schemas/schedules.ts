import { z } from "zod";
import {
  dateRangeSchema,
  dateSchema,
  dateTimeSchema,
  dayOfWeekSchema,
  idSchema,
  isDateTimeBefore,
  scheduleStatusSchema,
  timeSchema,
} from "./common";

export const scheduleAssignmentSchema = z.object({
  id: idSchema,
  scheduleId: idSchema,
  workerId: idSchema,
  workDate: dateSchema,
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  workerNameSnapshot: z.string(),
  employeeCodeSnapshot: z.string(),
});

const scheduleAssignmentInputBaseSchema = z.object({
  workerId: idSchema,
  workDate: dateSchema,
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
});
export const scheduleAssignmentInputSchema = scheduleAssignmentInputBaseSchema.refine(
  (value) => isDateTimeBefore(value.startsAt, value.endsAt),
  {
    message: "종료 시각은 시작 시각보다 늦어야 합니다.",
    path: ["endsAt"],
  },
);

export const updateScheduleAssignmentRequestSchema = scheduleAssignmentInputBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 값을 하나 이상 입력해야 합니다.",
  });

export const scheduleWorkerShortageSchema = z.object({
  id: idSchema,
  scheduleId: idSchema,
  workDate: dateSchema,
  dayOfWeek: dayOfWeekSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  endsNextDay: z.boolean(),
  requiredCount: z.number().int().min(1),
  assignedCount: z.number().int().min(0),
});

export const scheduleSummarySchema = z.object({
  id: idSchema,
  status: scheduleStatusSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  generatedAt: dateTimeSchema,
  confirmedAt: dateTimeSchema.nullable(),
});

export const scheduleDetailSchema = scheduleSummarySchema.extend({
  assignments: z.array(scheduleAssignmentSchema),
  workerShortages: z.array(scheduleWorkerShortageSchema),
});

export const recommendScheduleRequestSchema = dateRangeSchema;

export const draftScheduleQuerySchema = dateRangeSchema;

export const draftScheduleResponseSchema = z.object({
  schedule: scheduleDetailSchema.nullable(),
});
