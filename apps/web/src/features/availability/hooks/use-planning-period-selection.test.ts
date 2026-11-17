import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  type PlanningPeriodRange,
  usePlanningPeriodSelection,
} from "./use-planning-period-selection";

type HookProps = {
  activePlanningPeriod: PlanningPeriodRange | null | undefined;
  hasUnsavedChanges: boolean;
  onApplyBlocked?: () => void;
  onPeriodApplied?: (period: PlanningPeriodRange | null) => void;
};

const SAVED_PERIOD = { endDate: "2026-11-29", startDate: "2026-11-23" };
const NEXT_PERIOD = { endDate: "2026-12-06", startDate: "2026-11-30" };

function renderSelection(initialProps: HookProps) {
  return renderHook((props: HookProps) => usePlanningPeriodSelection(props), { initialProps });
}

describe("usePlanningPeriodSelection", () => {
  it("저장된 근무 기간이 없을 때 고른 시작일을 지우지 않는다", () => {
    const { result } = renderSelection({ activePlanningPeriod: null, hasUnsavedChanges: false });

    act(() => {
      result.current.setWorkStartDate("2026-11-23");
    });

    expect(result.current.workStartDate).toBe("2026-11-23");
    expect(result.current.workEndDate).toBe("");
  });

  it("저장된 근무 기간이 있을 때 새 시작일을 골라도 저장된 기간으로 되돌리지 않는다", () => {
    const { result } = renderSelection({
      activePlanningPeriod: SAVED_PERIOD,
      hasUnsavedChanges: false,
    });

    expect(result.current.workStartDate).toBe(SAVED_PERIOD.startDate);

    act(() => {
      result.current.setWorkStartDate("2026-12-01");
      result.current.setWorkEndDate("");
    });

    expect(result.current.workStartDate).toBe("2026-12-01");
    expect(result.current.workEndDate).toBe("");
  });

  it("서버 근무 기간이 바뀌면 선택값에 반영한다", () => {
    const onPeriodApplied = vi.fn();
    const { rerender, result } = renderSelection({
      activePlanningPeriod: SAVED_PERIOD,
      hasUnsavedChanges: false,
      onPeriodApplied,
    });

    rerender({ activePlanningPeriod: NEXT_PERIOD, hasUnsavedChanges: false, onPeriodApplied });

    expect(result.current.workStartDate).toBe(NEXT_PERIOD.startDate);
    expect(result.current.workEndDate).toBe(NEXT_PERIOD.endDate);
    expect(onPeriodApplied).toHaveBeenLastCalledWith(NEXT_PERIOD);
  });

  it("resetToAppliedPeriod는 고르던 날짜를 마지막으로 반영한 서버 기간으로 되돌린다", () => {
    const { result } = renderSelection({
      activePlanningPeriod: SAVED_PERIOD,
      hasUnsavedChanges: false,
    });

    act(() => {
      result.current.setWorkStartDate("2026-12-01");
      result.current.setWorkEndDate("");
    });
    act(() => {
      result.current.resetToAppliedPeriod();
    });

    expect(result.current.workStartDate).toBe(SAVED_PERIOD.startDate);
    expect(result.current.workEndDate).toBe(SAVED_PERIOD.endDate);
  });

  it("저장된 근무 기간이 없으면 resetToAppliedPeriod는 선택값을 비운다", () => {
    const { result } = renderSelection({ activePlanningPeriod: null, hasUnsavedChanges: false });

    act(() => {
      result.current.setWorkStartDate("2026-11-23");
    });
    act(() => {
      result.current.resetToAppliedPeriod();
    });

    expect(result.current.workStartDate).toBe("");
    expect(result.current.workEndDate).toBe("");
  });

  it("저장하지 않은 변경이 있으면 서버 기간 반영을 미뤘다가 변경이 정리되면 반영한다", () => {
    const onApplyBlocked = vi.fn();
    const { rerender, result } = renderSelection({
      activePlanningPeriod: SAVED_PERIOD,
      hasUnsavedChanges: false,
      onApplyBlocked,
    });

    rerender({ activePlanningPeriod: NEXT_PERIOD, hasUnsavedChanges: true, onApplyBlocked });

    expect(result.current.workStartDate).toBe(SAVED_PERIOD.startDate);
    expect(onApplyBlocked).toHaveBeenCalled();

    rerender({ activePlanningPeriod: NEXT_PERIOD, hasUnsavedChanges: false, onApplyBlocked });

    expect(result.current.workStartDate).toBe(NEXT_PERIOD.startDate);
    expect(result.current.workEndDate).toBe(NEXT_PERIOD.endDate);
  });
});
