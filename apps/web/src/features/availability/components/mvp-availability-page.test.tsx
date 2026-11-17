import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MvpAvailabilityPage } from "./mvp-availability-page";

type PlanningPeriod = { endDate: string; id: string; startDate: string } | null;

const mocks = vi.hoisted(() => ({
  planningPeriod: null as PlanningPeriod,
  upsertPlanningPeriod: vi.fn(),
}));

vi.mock("@/features/availability/queries/availability-queries", () => ({
  useAvailabilityQuery: () => ({ data: undefined, error: null, isFetching: false }),
  useReplaceAvailabilityMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/features/organization/queries/organization-queries", () => ({
  useActiveSchedulePlanningPeriodQuery: () => ({
    data: { period: mocks.planningPeriod },
    error: null,
    isLoading: false,
  }),
  useOrganizationQuery: () => ({
    data: { businessHours: [] },
    error: null,
    isLoading: false,
  }),
  useUpsertActiveSchedulePlanningPeriodMutation: () => ({ mutate: mocks.upsertPlanningPeriod }),
}));

vi.mock("@/features/staffing-rules/queries/staffing-rules-queries", () => ({
  useMinimumStaffingRulesQuery: () => ({ data: { items: [] }, error: null, isLoading: false }),
}));

vi.mock("@/features/workers/queries/workers-queries", () => ({
  useWorkersQuery: () => ({ data: { items: [] }, error: null, isLoading: false }),
}));

function getSelectedPeriodLabel() {
  return screen.getByText("선택 기간").nextElementSibling?.textContent;
}

function openPeriodDialog() {
  fireEvent.click(screen.getByRole("button", { name: "기간 선택" }));
}

describe("MvpAvailabilityPage 근무 기간 선택", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-17T09:00:00+09:00"));
    mocks.planningPeriod = null;
    mocks.upsertPlanningPeriod.mockReset();
  });

  afterEach(() => {
    // vitest globals를 쓰지 않아 Testing Library 자동 정리가 동작하지 않으므로 직접 정리한다.
    cleanup();
    vi.useRealTimers();
  });

  it("근무 기간 저장이 실패하면 실패 메시지를 보여 준다", () => {
    mocks.upsertPlanningPeriod.mockImplementation((_request, options) => {
      options?.onError?.(new Error("network"));
    });
    render(<MvpAvailabilityPage />);

    openPeriodDialog();
    fireEvent.click(screen.getByRole("button", { name: "11.23.(월) 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "11.29.(일) 선택" }));

    expect(mocks.upsertPlanningPeriod).toHaveBeenCalledWith(
      { endDate: "2026-11-29", startDate: "2026-11-23" },
      expect.anything(),
    );
    expect(screen.getByRole("status")).toHaveTextContent("근무 기간 저장에 실패했습니다.");
    expect(getSelectedPeriodLabel()).toBe("시작일 선택");
  });

  it("시작일만 고르고 닫으면 저장된 근무 기간으로 되돌린다", () => {
    mocks.planningPeriod = { endDate: "2026-11-29", id: "1", startDate: "2026-11-23" };
    render(<MvpAvailabilityPage />);

    expect(getSelectedPeriodLabel()).toBe("11.23.(월) - 11.29.(일)");

    openPeriodDialog();
    fireEvent.click(screen.getByRole("button", { name: "11.30.(월) 선택" }));
    expect(getSelectedPeriodLabel()).toBe("11.30.(월) - 종료일 선택");

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(mocks.upsertPlanningPeriod).not.toHaveBeenCalled();
    expect(getSelectedPeriodLabel()).toBe("11.23.(월) - 11.29.(일)");
  });
});
