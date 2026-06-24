"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOrganization,
  getOrganization,
  updateOrganization,
} from "@/features/organization/api/organization-api";
import { organizationQueryKey } from "./organization-query-keys";

export { organizationQueryKey } from "./organization-query-keys";

export function useOrganizationQuery() {
  return useQuery({
    queryFn: getOrganization,
    queryKey: organizationQueryKey,
  });
}

export function useCreateOrganizationMutation() {
  return useMutation({
    mutationFn: createOrganization,
  });
}

export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganization,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationQueryKey });
    },
  });
}
