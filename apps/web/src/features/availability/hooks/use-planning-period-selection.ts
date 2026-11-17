import { useCallback, useEffect, useRef, useState } from "react";

export type PlanningPeriodRange = {
  endDate: string;
  startDate: string;
};

type UsePlanningPeriodSelectionOptions = {
  /** 서버에 저장된 활성 근무 기간. 불러오는 중이면 undefined, 저장된 기간이 없으면 null */
  activePlanningPeriod: PlanningPeriodRange | null | undefined;
  /** 저장하지 않은 가능 시간 변경이 있는지 여부 */
  hasUnsavedChanges: boolean;
  /** 저장하지 않은 변경 때문에 서버 기간 반영을 미뤘을 때 호출 */
  onApplyBlocked?: () => void;
  /** 서버 기간을 화면 선택값에 반영했을 때 호출 */
  onPeriodApplied?: (period: PlanningPeriodRange | null) => void;
};

function getPeriodKey(period: PlanningPeriodRange | null) {
  return period ? `${period.startDate}~${period.endDate}` : "";
}

/**
 * 가능 시간 화면의 근무 기간 선택값을 관리합니다.
 *
 * 서버 기간이 마지막으로 반영한 값에서 바뀌었을 때만 선택값을 덮어씁니다.
 * 사용자가 달력에서 시작일만 고른 중간 상태는 서버 기간과 다르지만 그대로 유지해야 하므로,
 * 선택값이 바뀔 때마다 서버 기간으로 되돌리지 않습니다.
 * 선택을 끝내지 않고 닫거나 저장에 실패했을 때는 `resetToAppliedPeriod`로 되돌립니다.
 */
export function usePlanningPeriodSelection({
  activePlanningPeriod,
  hasUnsavedChanges,
  onApplyBlocked,
  onPeriodApplied,
}: UsePlanningPeriodSelectionOptions) {
  const [workStartDate, setWorkStartDate] = useState("");
  const [workEndDate, setWorkEndDate] = useState("");
  const appliedPeriodRef = useRef<{ key: string; period: PlanningPeriodRange | null } | null>(null);
  const callbacksRef = useRef({ onApplyBlocked, onPeriodApplied });

  useEffect(() => {
    callbacksRef.current = { onApplyBlocked, onPeriodApplied };
  });

  useEffect(() => {
    if (activePlanningPeriod === undefined) {
      return;
    }

    const periodKey = getPeriodKey(activePlanningPeriod);

    if (appliedPeriodRef.current?.key === periodKey) {
      return;
    }

    const selectedPeriodKey = getPeriodKey(
      workStartDate && workEndDate ? { endDate: workEndDate, startDate: workStartDate } : null,
    );

    if (hasUnsavedChanges && periodKey !== selectedPeriodKey) {
      callbacksRef.current.onApplyBlocked?.();
      return;
    }

    appliedPeriodRef.current = { key: periodKey, period: activePlanningPeriod };
    setWorkStartDate(activePlanningPeriod?.startDate ?? "");
    setWorkEndDate(activePlanningPeriod?.endDate ?? "");
    callbacksRef.current.onPeriodApplied?.(activePlanningPeriod);
  }, [activePlanningPeriod, hasUnsavedChanges, workEndDate, workStartDate]);

  const resetToAppliedPeriod = useCallback(() => {
    const appliedPeriod = appliedPeriodRef.current?.period ?? null;

    setWorkStartDate(appliedPeriod?.startDate ?? "");
    setWorkEndDate(appliedPeriod?.endDate ?? "");
  }, []);

  return { resetToAppliedPeriod, setWorkEndDate, setWorkStartDate, workEndDate, workStartDate };
}
