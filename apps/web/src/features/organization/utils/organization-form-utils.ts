import type { CreateOrganizationRequest, OrganizationDetail } from "@fragment/shared";
import {
  createOrganizationRequestSchema,
  DAY_OF_WEEK_VALUES,
  dayOfWeekSchema,
} from "@fragment/shared";
import { z } from "zod";

export type DayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number];

export type BusinessHour = {
  openTime: string;
  closeTime: string;
};

export type OrganizationFormValues = {
  name: string;
  businessHours: Record<DayOfWeek, BusinessHour>;
  weeklyClosedDays: DayOfWeek[];
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "월요일",
  TUE: "화요일",
  WED: "수요일",
  THU: "목요일",
  FRI: "금요일",
  SAT: "토요일",
  SUN: "일요일",
};

export const ORGANIZATION_DAYS = DAY_OF_WEEK_VALUES.map((value) => ({
  value,
  label: DAY_LABELS[value],
}));

const DEFAULT_WEEKDAY_BUSINESS_HOUR: BusinessHour = {
  openTime: "09:00",
  closeTime: "22:00",
};

const DEFAULT_WEEKEND_BUSINESS_HOUR: BusinessHour = {
  openTime: "10:00",
  closeTime: "20:00",
};

const WEEKEND_DAYS = new Set<DayOfWeek>(["SAT", "SUN"]);

export const DEFAULT_BUSINESS_HOURS = Object.fromEntries(
  DAY_OF_WEEK_VALUES.map((day) => [
    day,
    WEEKEND_DAYS.has(day) ? DEFAULT_WEEKEND_BUSINESS_HOUR : DEFAULT_WEEKDAY_BUSINESS_HOUR,
  ]),
) as Record<DayOfWeek, BusinessHour>;

export const DEFAULT_ORGANIZATION_FORM_VALUES: OrganizationFormValues = {
  name: "",
  businessHours: DEFAULT_BUSINESS_HOURS,
  weeklyClosedDays: ["SUN"],
};

const organizationBusinessHourFormSchema = z.object({
  openTime: z.string(),
  closeTime: z.string(),
});

const organizationBusinessHoursFormSchema = z.object(
  Object.fromEntries(
    DAY_OF_WEEK_VALUES.map((day) => [day, organizationBusinessHourFormSchema]),
  ) as Record<DayOfWeek, typeof organizationBusinessHourFormSchema>,
);

export const organizationFormSchema = z
  .object({
    name: z.string(),
    businessHours: organizationBusinessHoursFormSchema,
    weeklyClosedDays: z.array(dayOfWeekSchema),
  })
  .superRefine((values, context) => {
    const request = createOrganizationRequestFromForm(values);
    const result = createOrganizationRequestSchema.safeParse(request);

    if (result.success) {
      return;
    }

    result.error.issues.forEach((issue) => {
      const [field, index, nestedField] = issue.path;
      const businessHour =
        field === "businessHours" && typeof index === "number"
          ? request.businessHours[index]
          : undefined;

      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path:
          businessHour && typeof nestedField === "string"
            ? ["businessHours", businessHour.dayOfWeek, nestedField]
            : issue.path,
      });
    });
  });

export function createOrganizationRequestFromForm({
  businessHours,
  name,
  weeklyClosedDays,
}: OrganizationFormValues): CreateOrganizationRequest {
  return {
    name,
    businessHours: ORGANIZATION_DAYS.map((day) => {
      const isClosed = weeklyClosedDays.includes(day.value);
      const hours = businessHours[day.value] ?? DEFAULT_BUSINESS_HOURS[day.value];

      return {
        dayOfWeek: day.value,
        isClosed,
        openTime: isClosed ? null : hours.openTime,
        closeTime: isClosed ? null : hours.closeTime,
      };
    }),
  };
}

export function createOrganizationFormValuesFromDetail(
  organization: OrganizationDetail,
): OrganizationFormValues {
  const businessHoursByDay = new Map(
    organization.businessHours.map((businessHour) => [businessHour.dayOfWeek, businessHour]),
  );

  return {
    name: organization.name,
    businessHours: Object.fromEntries(
      DAY_OF_WEEK_VALUES.map((day) => {
        const businessHour = businessHoursByDay.get(day);
        const defaultBusinessHour = DEFAULT_BUSINESS_HOURS[day];

        return [
          day,
          {
            openTime: businessHour?.openTime ?? defaultBusinessHour.openTime,
            closeTime: businessHour?.closeTime ?? defaultBusinessHour.closeTime,
          },
        ];
      }),
    ) as Record<DayOfWeek, BusinessHour>,
    weeklyClosedDays: DAY_OF_WEEK_VALUES.filter(
      (day) => businessHoursByDay.get(day)?.isClosed ?? false,
    ),
  };
}
