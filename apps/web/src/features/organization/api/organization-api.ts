import type {
  CreateOrganizationRequest,
  OrganizationDetail,
  UpdateOrganizationRequest,
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
