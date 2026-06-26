"use client";

import type { AvailabilityQuery, ReplaceAvailabilityRequest } from "@fragment/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAvailability, replaceAvailability } from "@/features/availability/api/availability-api";
import { availabilityQueryKeys } from "./availability-query-keys";

export { availabilityQueryKeys } from "./availability-query-keys";

export function useAvailabilityQuery(query: AvailabilityQuery, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getAvailability(query),
    queryKey: availabilityQueryKeys.list(query),
  });
}

export function useReplaceAvailabilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: replaceAvailability,
    onSuccess: (_data, variables: ReplaceAvailabilityRequest) => {
      void queryClient.invalidateQueries({
        queryKey: availabilityQueryKeys.list({
          endDate: variables.endDate,
          startDate: variables.startDate,
          workerId: variables.workerId,
        }),
      });
    },
  });
}
