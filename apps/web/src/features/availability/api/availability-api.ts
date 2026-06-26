import type {
  AvailabilityListResponse,
  AvailabilityQuery,
  ReplaceAvailabilityRequest,
} from "@fragment/shared";

import { apiClient } from "@/lib/api-client";

function createAvailabilitySearchParams(query: AvailabilityQuery) {
  const searchParams = new URLSearchParams({
    endDate: query.endDate,
    startDate: query.startDate,
    workerId: query.workerId,
  });

  return searchParams.toString();
}

export function getAvailability(query: AvailabilityQuery) {
  return apiClient<AvailabilityListResponse>(
    `/availability?${createAvailabilitySearchParams(query)}`,
    {
      method: "GET",
    },
  );
}

export function replaceAvailability(request: ReplaceAvailabilityRequest) {
  return apiClient<AvailabilityListResponse>("/availability/bulk", {
    method: "PUT",
    body: request,
  });
}
