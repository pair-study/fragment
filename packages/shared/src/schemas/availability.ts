import { z } from "zod";
import {
  dateRangeBaseSchema,
  dateRangeSchema,
  dateSchema,
  dateTimeSchema,
  idSchema,
  isDateTimeBefore,
} from "./common";

export const availabilitySchema = z.object({
  id: idSchema,
  workerId: idSchema,
  availableDate: dateSchema,
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
});

export const availabilityInputSchema = availabilitySchema
  .omit({ id: true, workerId: true })
  .refine((value) => isDateTimeBefore(value.startsAt, value.endsAt), {
    message: "종료 시각은 시작 시각보다 늦어야 합니다.",
    path: ["endsAt"],
  });

export const availabilityQuerySchema = dateRangeBaseSchema
  .extend({
    workerId: idSchema,
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "종료 날짜는 시작 날짜보다 빠를 수 없습니다.",
    path: ["endDate"],
  });

export const replaceAvailabilityRequestSchema = dateRangeBaseSchema
  .extend({
    workerId: idSchema,
    items: z.array(availabilityInputSchema),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "종료 날짜는 시작 날짜보다 빠를 수 없습니다.",
    path: ["endDate"],
  });

export const availabilityListResponseSchema = z.object({
  items: z.array(availabilitySchema),
});
