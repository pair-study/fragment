import type { DraftScheduleQuery } from "@fragment/shared";

export const schedulesQueryKeys = {
  all: ["schedules"] as const,
  draft: (query: DraftScheduleQuery) => [...schedulesQueryKeys.all, "draft", query] as const,
};
