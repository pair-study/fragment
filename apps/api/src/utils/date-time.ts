const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isValidTimeString = (value: unknown): value is string =>
  typeof value === "string" && TIME_PATTERN.test(value);

export const timeStringToDate = (time: string): Date => {
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
};

export const dateToTimeString = (time: Date): string => {
  const hour = String(time.getUTCHours()).padStart(2, "0");
  const minute = String(time.getUTCMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

export const nullableTimeStringToDate = (time: string | null): Date | null =>
  time === null ? null : timeStringToDate(time);

export const nullableDateToTimeString = (time: Date | null): string | null =>
  time === null ? null : dateToTimeString(time);

export const parseTimeToMinutes = (time: string): number => {
  const match = time.match(TIME_PATTERN);

  if (!match) {
    throw new RangeError("Time must be in HH:mm format.");
  }

  const [, hour, minute] = match;

  return Number(hour) * 60 + Number(minute);
};

export const isDateTimeRangeOrdered = (startsAt: Date, endsAt: Date): boolean =>
  startsAt.getTime() < endsAt.getTime();

export const assertDateTimeRange = (startsAt: Date, endsAt: Date): void => {
  if (!isDateTimeRangeOrdered(startsAt, endsAt)) {
    throw new RangeError("Start date-time must be before end date-time.");
  }
};

export const getTimeRangeDurationMinutes = (startTime: string, endTime: string): number => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes === endMinutes) {
    throw new RangeError("시작 시간과 종료 시간은 같을 수 없습니다.");
  }

  return endMinutes > startMinutes
    ? endMinutes - startMinutes
    : endMinutes + 24 * 60 - startMinutes;
};

export const assertTimeRange = (startTime: string, endTime: string): void => {
  getTimeRangeDurationMinutes(startTime, endTime);
};
