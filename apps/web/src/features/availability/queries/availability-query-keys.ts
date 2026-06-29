import type { AvailabilityQuery } from "@fragment/shared";

export const availabilityQueryKeys = {
  all: ["availability"] as const,
  list: (query: AvailabilityQuery) => [...availabilityQueryKeys.all, "list", query] as const,
};
