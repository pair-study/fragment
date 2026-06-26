import { addDays } from "@/utils/date-time";

export const eachDateInRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];

  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    dates.push(date);
  }

  return dates;
};
