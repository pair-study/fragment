"use client";

import type { UpdateMinimumStaffingRuleRequest } from "@fragment/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMinimumStaffingRule,
  deleteMinimumStaffingRule,
  getMinimumStaffingRules,
  updateMinimumStaffingRule,
} from "@/features/staffing-rules/api/staffing-rules-api";
import { staffingRulesQueryKey } from "./staffing-rules-query-keys";

export { staffingRulesQueryKey } from "./staffing-rules-query-keys";

type UpdateMinimumStaffingRuleVariables = {
  ruleId: string;
  request: UpdateMinimumStaffingRuleRequest;
};

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
      void queryClient.invalidateQueries({ queryKey: staffingRulesQueryKey });
    },
  });
}

export function useUpdateMinimumStaffingRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ request, ruleId }: UpdateMinimumStaffingRuleVariables) =>
      updateMinimumStaffingRule(ruleId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffingRulesQueryKey });
    },
  });
}

export function useDeleteMinimumStaffingRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMinimumStaffingRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffingRulesQueryKey });
    },
  });
}
