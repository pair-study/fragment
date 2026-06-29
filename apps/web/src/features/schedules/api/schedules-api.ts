import type {
  DraftScheduleQuery,
  DraftScheduleResponse,
  RecommendScheduleRequest,
  ScheduleAssignment,
  ScheduleAssignmentInput,
  ScheduleDetail,
  UpdateScheduleAssignmentRequest,
} from "@fragment/shared";

import { apiClient } from "@/lib/api-client";

function createDraftScheduleSearchParams(query: DraftScheduleQuery) {
  const searchParams = new URLSearchParams({
    endDate: query.endDate,
    startDate: query.startDate,
  });

  return searchParams.toString();
}

export function getDraftSchedule(query: DraftScheduleQuery) {
  return apiClient<DraftScheduleResponse>(
    `/schedules/draft?${createDraftScheduleSearchParams(query)}`,
    {
      method: "GET",
    },
  );
}

export function recommendSchedule(request: RecommendScheduleRequest) {
  return apiClient<ScheduleDetail>("/schedules/recommend", {
    method: "POST",
    body: request,
  });
}

export function createScheduleAssignment(scheduleId: string, request: ScheduleAssignmentInput) {
  return apiClient<ScheduleAssignment>(`/schedules/${scheduleId}/assignments`, {
    method: "POST",
    body: request,
  });
}

export function updateScheduleAssignment(
  scheduleId: string,
  assignmentId: string,
  request: UpdateScheduleAssignmentRequest,
) {
  return apiClient<ScheduleAssignment>(`/schedules/${scheduleId}/assignments/${assignmentId}`, {
    method: "PATCH",
    body: request,
  });
}

export function deleteScheduleAssignment(scheduleId: string, assignmentId: string) {
  return apiClient(`/schedules/${scheduleId}/assignments/${assignmentId}`, {
    method: "DELETE",
    responseType: "void",
  });
}

export function confirmSchedule(scheduleId: string) {
  return apiClient<ScheduleDetail>(`/schedules/${scheduleId}/confirm`, {
    method: "POST",
  });
}
