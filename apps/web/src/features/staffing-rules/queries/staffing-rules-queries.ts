"use client";

import type { UpdateMinimumStaffingRuleRequest } from "@fragment/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMinimumStaffingRule,
  deleteMinimumStaffingRule,
  getMinimumStaffingRules,
  updateMinimumStaffingRule,
} from "@/features/staffing-rules/api/staffing-rules-api";
import { availabilityQueryKeys } from "@/features/availability/queries/availability-queries";
import { schedulesQueryKeys } from "@/features/schedules/queries/schedules-queries";
import { staffingRulesQueryKey } from "./staffing-rules-query-keys";

export { staffingRulesQueryKey } from "./staffing-rules-query-keys";

type UpdateMinimumStaffingRuleVariables = {
  ruleId: string;
  request: UpdateMinimumStaffingRuleRequest;
};

function invalidatePolicyDependentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: staffingRulesQueryKey });
  void queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: schedulesQueryKeys.all });
}

export function useMinimumStaffingRulesQuery() {
  return useQuery({
    queryFn: getMinimumStaffingRules,
    queryKey: staffingRulesQueryKey,
  });
}

export function useCreateMinimumStaffingRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMinimumStaffingRule,
    onSuccess: () => {
      invalidatePolicyDependentQueries(queryClient);
    },
  });
}

export function useUpdateMinimumStaffingRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, ruleId }: UpdateMinimumStaffingRuleVariables) =>
      updateMinimumStaffingRule(ruleId, request),
    onSuccess: () => {
      invalidatePolicyDependentQueries(queryClient);
    },
  });
}

export function useDeleteMinimumStaffingRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMinimumStaffingRule,
    onSuccess: () => {
      invalidatePolicyDependentQueries(queryClient);
    },
  });
}
