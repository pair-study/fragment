import type {
  CreateMinimumStaffingRuleRequest,
  MinimumStaffingRule,
  MinimumStaffingRulesListResponse,
  UpdateMinimumStaffingRuleRequest,
} from "@fragment/shared";

import { apiClient } from "@/lib/api-client";

export function getMinimumStaffingRules() {
  return apiClient<MinimumStaffingRulesListResponse>("/staffing-rules", {
    method: "GET",
  });
}

export function createMinimumStaffingRule(request: CreateMinimumStaffingRuleRequest) {
  return apiClient<MinimumStaffingRule>("/staffing-rules", {
    method: "POST",
    body: request,
  });
}

export function updateMinimumStaffingRule(
  ruleId: string,
  request: UpdateMinimumStaffingRuleRequest,
) {
  return apiClient<MinimumStaffingRule>(`/staffing-rules/${ruleId}`, {
    method: "PATCH",
    body: request,
  });
}

export function deleteMinimumStaffingRule(ruleId: string) {
  return apiClient(`/staffing-rules/${ruleId}`, {
    method: "DELETE",
    responseType: "void",
  });
}
