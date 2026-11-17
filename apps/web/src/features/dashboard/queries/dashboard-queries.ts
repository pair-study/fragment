"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboard } from "@/features/dashboard/api/dashboard-api";
import { dashboardQueryKey } from "./dashboard-query-keys";

export { dashboardQueryKey } from "./dashboard-query-keys";

export function useDashboardQuery() {
  return useQuery({
    queryFn: getDashboard,
    queryKey: dashboardQueryKey,
  });
}
