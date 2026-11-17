import type {
  ScheduleHistoryDetailResponse,
  ScheduleHistoryListResponse,
  ScheduleHistoryQuery,
} from "@fragment/shared";

import { apiClient } from "@/lib/api-client";

function createScheduleHistorySearchParams(query: ScheduleHistoryQuery) {
  const searchParams = new URLSearchParams();

  if (query.year !== undefined) {
    searchParams.set("year", String(query.year));
  }

  if (query.month !== undefined) {
    searchParams.set("month", String(query.month));
  }

  return searchParams.toString();
}

export function getScheduleHistory(query: ScheduleHistoryQuery) {
  const searchParams = createScheduleHistorySearchParams(query);

  return apiClient<ScheduleHistoryListResponse>(
    `/schedule-history${searchParams ? `?${searchParams}` : ""}`,
    {
      method: "GET",
    },
  );
}

export function getScheduleHistoryDetail(scheduleId: string) {
  return apiClient<ScheduleHistoryDetailResponse>(`/schedule-history/${scheduleId}`, {
    method: "GET",
  });
}

export function exportScheduleHistoryCsv(scheduleId: string) {
  return apiClient(`/schedule-history/${scheduleId}/export.csv`, {
    headers: {
      accept: "text/csv",
    },
    method: "GET",
    responseType: "blob",
  });
}
