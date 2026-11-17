import type { ScheduleHistoryQuery } from "@fragment/shared";

export const scheduleHistoryQueryKeys = {
  all: ["schedule-history"] as const,
  detail: (scheduleId: string) => [...scheduleHistoryQueryKeys.all, "detail", scheduleId] as const,
  list: (query: ScheduleHistoryQuery) => [...scheduleHistoryQueryKeys.all, "list", query] as const,
};
