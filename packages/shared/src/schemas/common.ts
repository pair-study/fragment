import { z } from "zod";

export const idSchema = z.string().regex(/^\d+$/, "ID는 숫자 문자열이어야 합니다.");

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const isValidDate = (value: string) => {
  if (!datePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

export const dateSchema = z
  .string()
  .regex(datePattern, "날짜는 YYYY-MM-DD 형식이어야 합니다.")
  .refine(isValidDate, "유효한 날짜여야 합니다.");

export const timeSchema = z.string().regex(timePattern, "시간은 HH:mm 형식이어야 합니다.");

export const dateTimeSchema = z.string().datetime({ offset: true });

export const isDateTimeBefore = (startDateTime: string, endDateTime: string) =>
  Date.parse(startDateTime) < Date.parse(endDateTime);

export const dayOfWeekSchema = z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);

export const scheduleStatusSchema = z.enum(["DRAFT", "CONFIRMED"]);

export const errorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "DUPLICATE_EMAIL",
  "ORGANIZATION_REQUIRED",
  "ORGANIZATION_ALREADY_EXISTS",
  "WORKER_NOT_FOUND",
  "SCHEDULE_NOT_FOUND",
  "DRAFT_ALREADY_EXISTS",
  "NO_ACTIVE_PLANNING_PERIOD",
  "INVALID_TIME_RANGE",
  "CLOSED_DAY",
]);

export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  errorCode: errorCodeSchema,
  message: z.string(),
});

export const emptyResponseSchema = z.undefined();

export const dateRangeBaseSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
});

export const dateRangeSchema = dateRangeBaseSchema.refine(
  (value) => value.startDate <= value.endDate,
  {
    message: "종료 날짜는 시작 날짜보다 빠를 수 없습니다.",
    path: ["endDate"],
  },
);

export const idParamsSchema = z.object({
  id: idSchema,
});
