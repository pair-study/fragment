import type { DashboardResponse } from "@fragment/shared";

import { apiClient } from "@/lib/api-client";

export function getDashboard() {
  return apiClient<DashboardResponse>("/dashboard", {
    method: "GET",
  });
}
