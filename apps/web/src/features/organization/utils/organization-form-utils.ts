import type { CreateOrganizationRequest, OrganizationDetail } from "@fragment/shared";
import { DAY_OF_WEEK_VALUES } from "@fragment/shared";

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

export type OrganizationFormErrors = {
  name?: string;
  businessHours?: Partial<Record<DayOfWeek, string>>;
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

export function validateOrganizationForm({
  businessHours,
  name,
  weeklyClosedDays,
}: OrganizationFormValues) {
  const errors: OrganizationFormErrors = {};
  const businessHourErrors: Partial<Record<DayOfWeek, string>> = {};

  if (!name.trim()) {
    errors.name = "조직명을 입력하세요.";
  }

  ORGANIZATION_DAYS.forEach((day) => {
    if (weeklyClosedDays.includes(day.value)) {
      return;
    }

    const hours = businessHours[day.value];

    if (!hours.openTime || !hours.closeTime) {
      businessHourErrors[day.value] = "운영 시작/종료 시간을 모두 선택하세요.";
      return;
    }

    if (hours.closeTime <= hours.openTime) {
      businessHourErrors[day.value] = "운영 종료 시간은 시작 시간보다 늦어야 합니다.";
    }
  });

  if (ORGANIZATION_DAYS.every((day) => weeklyClosedDays.includes(day.value))) {
    businessHourErrors.MON = "최소 하루 이상 운영 시간이 필요합니다.";
  }

  if (Object.keys(businessHourErrors).length > 0) {
    errors.businessHours = businessHourErrors;
  }

  return errors;
}

export function createOrganizationRequestFromForm({
  businessHours,
  name,
  weeklyClosedDays,
}: OrganizationFormValues): CreateOrganizationRequest {
  return {
    name,
    businessHours: ORGANIZATION_DAYS.map((day) => {
      const isClosed = weeklyClosedDays.includes(day.value);
      const hours = businessHours[day.value];

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
