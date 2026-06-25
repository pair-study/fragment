import type {
  CreateWorkerRequest,
  UpdateWorkerRequest,
  Worker,
  WorkersListResponse,
} from "@fragment/shared";

import { apiClient } from "@/lib/api-client";

export function getWorkers() {
  return apiClient<WorkersListResponse>("/workers", {
    method: "GET",
  });
}

export function createWorker(request: CreateWorkerRequest) {
  return apiClient<Worker>("/workers", {
    method: "POST",
    body: request,
  });
}

export function updateWorker(workerId: string, request: UpdateWorkerRequest) {
  return apiClient<Worker>(`/workers/${workerId}`, {
    method: "PATCH",
    body: request,
  });
}

export function deleteWorker(workerId: string) {
  return apiClient(`/workers/${workerId}`, {
    method: "DELETE",
    responseType: "void",
  });
}
