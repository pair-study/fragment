"use client";

import type {
  DraftScheduleQuery,
  DraftScheduleResponse,
  RecommendScheduleRequest,
  ScheduleAssignmentInput,
  UpdateScheduleAssignmentRequest,
} from "@fragment/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  confirmSchedule,
  createScheduleAssignment,
  deleteScheduleAssignment,
  getDraftSchedule,
  recommendSchedule,
  updateScheduleAssignment,
} from "@/features/schedules/api/schedules-api";
import { schedulesQueryKeys } from "./schedules-query-keys";

export { schedulesQueryKeys } from "./schedules-query-keys";

type ScheduleMutationContext = {
  query: DraftScheduleQuery;
};

type CreateScheduleAssignmentVariables = ScheduleMutationContext & {
  request: ScheduleAssignmentInput;
  scheduleId: string;
};

type UpdateScheduleAssignmentVariables = ScheduleMutationContext & {
  assignmentId: string;
  request: UpdateScheduleAssignmentRequest;
  scheduleId: string;
};

type DeleteScheduleAssignmentVariables = ScheduleMutationContext & {
  assignmentId: string;
  scheduleId: string;
};

type ConfirmScheduleVariables = ScheduleMutationContext & {
  scheduleId: string;
};

function useInvalidateDraftSchedule() {
  const queryClient = useQueryClient();

  return (query: DraftScheduleQuery) =>
    queryClient.invalidateQueries({
      queryKey: schedulesQueryKeys.draft(query),
    });
}

export function useDraftScheduleQuery(query: DraftScheduleQuery, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getDraftSchedule(query),
    queryKey: schedulesQueryKeys.draft(query),
  });
}

export function useRecommendScheduleMutation() {
  const invalidateDraftSchedule = useInvalidateDraftSchedule();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RecommendScheduleRequest) => recommendSchedule(request),
    onSuccess: (data, variables) => {
      queryClient.setQueryData<DraftScheduleResponse>(schedulesQueryKeys.draft(variables), {
        schedule: data,
      });
      void invalidateDraftSchedule(variables);
    },
  });
}

export function useCreateScheduleAssignmentMutation() {
  const invalidateDraftSchedule = useInvalidateDraftSchedule();

  return useMutation({
    mutationFn: ({ request, scheduleId }: CreateScheduleAssignmentVariables) =>
      createScheduleAssignment(scheduleId, request),
    onSuccess: (_data, variables) => {
      void invalidateDraftSchedule(variables.query);
    },
  });
}

export function useUpdateScheduleAssignmentMutation() {
  const invalidateDraftSchedule = useInvalidateDraftSchedule();

  return useMutation({
    mutationFn: ({ assignmentId, request, scheduleId }: UpdateScheduleAssignmentVariables) =>
      updateScheduleAssignment(scheduleId, assignmentId, request),
    onSuccess: (_data, variables) => {
      void invalidateDraftSchedule(variables.query);
    },
  });
}

export function useDeleteScheduleAssignmentMutation() {
  const invalidateDraftSchedule = useInvalidateDraftSchedule();

  return useMutation({
    mutationFn: ({ assignmentId, scheduleId }: DeleteScheduleAssignmentVariables) =>
      deleteScheduleAssignment(scheduleId, assignmentId),
    onSuccess: (_data, variables) => {
      void invalidateDraftSchedule(variables.query);
    },
  });
}

export function useConfirmScheduleMutation() {
  const invalidateDraftSchedule = useInvalidateDraftSchedule();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scheduleId }: ConfirmScheduleVariables) => confirmSchedule(scheduleId),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<DraftScheduleResponse>(schedulesQueryKeys.draft(variables.query), {
        schedule: null,
      });
      void invalidateDraftSchedule(variables.query);
    },
  });
}
