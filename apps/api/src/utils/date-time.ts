const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isValidTimeString = (value: unknown): value is string =>
  typeof value === "string" && TIME_PATTERN.test(value);

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

export const assertTimeRange = (startTime: string, endTime: string): void => {
  if (parseTimeToMinutes(startTime) >= parseTimeToMinutes(endTime)) {
    throw new RangeError("Start time must be before end time.");
  }
};
