export const DAY_OF_WEEK_VALUES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export type ApiDayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number];

const DAY_OF_WEEK_SET = new Set<string>(DAY_OF_WEEK_VALUES);

export const isDayOfWeek = (value: unknown): value is ApiDayOfWeek =>
  typeof value === "string" && DAY_OF_WEEK_SET.has(value);

export const parseDayOfWeek = (value: unknown): ApiDayOfWeek => {
  if (!isDayOfWeek(value)) {
    throw new RangeError("Day of week must be one of MON, TUE, WED, THU, FRI, SAT, SUN.");
  }

  return value;
};
