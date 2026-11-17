"use client";

import type { ScheduleHistoryQuery } from "@fragment/shared";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  exportScheduleHistoryCsv,
  getScheduleHistory,
  getScheduleHistoryDetail,
} from "@/features/schedule-history/api/schedule-history-api";
import { scheduleHistoryQueryKeys } from "./schedule-history-query-keys";

export { scheduleHistoryQueryKeys } from "./schedule-history-query-keys";

export function useScheduleHistoryQuery(query: ScheduleHistoryQuery) {
  return useQuery({
    queryFn: () => getScheduleHistory(query),
    queryKey: scheduleHistoryQueryKeys.list(query),
  });
}

export function useScheduleHistoryDetailQuery(scheduleId: string, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getScheduleHistoryDetail(scheduleId),
    queryKey: scheduleHistoryQueryKeys.detail(scheduleId),
  });
}

export function useExportScheduleHistoryCsvMutation() {
  return useMutation({
    mutationFn: exportScheduleHistoryCsv,
  });
}
