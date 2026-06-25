import { DAY_OF_WEEK_VALUES } from "@fragment/shared";

type BusinessHourInput = {
  dayOfWeek: (typeof DAY_OF_WEEK_VALUES)[number];
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
};

export const createBusinessHoursInput = (
  overrides: Partial<Record<(typeof DAY_OF_WEEK_VALUES)[number], Partial<BusinessHourInput>>> = {},
) =>
  DAY_OF_WEEK_VALUES.map((dayOfWeek) => ({
    dayOfWeek,
    isClosed: false,
    openTime: "09:00",
    closeTime: "18:00",
    ...overrides[dayOfWeek],
  }));
