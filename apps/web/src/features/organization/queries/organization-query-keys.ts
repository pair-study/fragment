export const organizationQueryKeys = {
  activeSchedulePlanningPeriod: ["organization", "active-schedule-planning-period"] as const,
  detail: ["organization"] as const,
};

export const organizationQueryKey = organizationQueryKeys.detail;
