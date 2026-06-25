"use client";

import type { UpdateWorkerRequest } from "@fragment/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createWorker,
  deleteWorker,
  getWorkers,
  updateWorker,
} from "@/features/workers/api/workers-api";
import { workersQueryKey } from "./workers-query-keys";

export { workersQueryKey } from "./workers-query-keys";

type UpdateWorkerVariables = {
  request: UpdateWorkerRequest;
  workerId: string;
};

export function useWorkersQuery() {
  return useQuery({
    queryFn: getWorkers,
    queryKey: workersQueryKey,
  });
}

export function useCreateWorkerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workersQueryKey });
    },
  });
}

export function useUpdateWorkerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, workerId }: UpdateWorkerVariables) => updateWorker(workerId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workersQueryKey });
    },
  });
}

export function useDeleteWorkerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorker,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workersQueryKey });
    },
  });
}
