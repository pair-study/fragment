import type {
  ActiveSchedulePlanningPeriod,
  ActiveSchedulePlanningPeriodResponse,
  CreateOrganizationRequest,
  OrganizationDetail,
  UpdateOrganizationRequest,
  UpsertActiveSchedulePlanningPeriodRequest,
} from "@fragment/shared";

import { apiClient } from "@/lib/api-client";

export function getOrganization() {
  return apiClient<OrganizationDetail>("/organization", {
    method: "GET",
  });
}

export function createOrganization(request: CreateOrganizationRequest) {
  return apiClient<OrganizationDetail>("/organization", {
    method: "POST",
    body: request,
  });
}

export function updateOrganization(request: UpdateOrganizationRequest) {
  return apiClient<OrganizationDetail>("/organization", {
    method: "PATCH",
    body: request,
  });
}

export function getActiveSchedulePlanningPeriod() {
  return apiClient<ActiveSchedulePlanningPeriodResponse>(
    "/organization/active-schedule-planning-period",
    {
      method: "GET",
    },
  );
}

export function upsertActiveSchedulePlanningPeriod(
  request: UpsertActiveSchedulePlanningPeriodRequest,
) {
  return apiClient<ActiveSchedulePlanningPeriod>("/organization/active-schedule-planning-period", {
    method: "PUT",
    body: request,
  });
}

export function deleteActiveSchedulePlanningPeriod() {
  return apiClient("/organization/active-schedule-planning-period", {
    method: "DELETE",
    responseType: "void",
  });
}
