"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOrganization,
  deleteActiveSchedulePlanningPeriod,
  getActiveSchedulePlanningPeriod,
  getOrganization,
  updateOrganization,
  upsertActiveSchedulePlanningPeriod,
} from "@/features/organization/api/organization-api";
import { organizationQueryKey, organizationQueryKeys } from "./organization-query-keys";

export { organizationQueryKey, organizationQueryKeys } from "./organization-query-keys";

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

export function useActiveSchedulePlanningPeriodQuery() {
  return useQuery({
    queryFn: getActiveSchedulePlanningPeriod,
    queryKey: organizationQueryKeys.activeSchedulePlanningPeriod,
  });
}

export function useUpsertActiveSchedulePlanningPeriodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertActiveSchedulePlanningPeriod,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.activeSchedulePlanningPeriod,
      });
    },
  });
}

export function useDeleteActiveSchedulePlanningPeriodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActiveSchedulePlanningPeriod,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.activeSchedulePlanningPeriod,
      });
    },
  });
}
