"use client";

import type {
  DraftScheduleQuery,
  ScheduleAssignment,
  ScheduleAssignmentInput,
  ScheduleCandidate,
  ScheduleDetail,
  ScheduleWorkerShortage,
  Worker,
} from "@fragment/shared";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@moyeorak/design-system";
import { CalendarDays, Check, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveSchedulePlanningPeriodQuery } from "@/features/organization/queries/organization-queries";
import {
  useConfirmScheduleMutation,
  useCreateScheduleAssignmentMutation,
  useDeleteScheduleAssignmentMutation,
  useDraftScheduleQuery,
  useRecommendScheduleMutation,
  useUpdateScheduleAssignmentMutation,
} from "@/features/schedules/queries/schedules-queries";
import { useMinimumStaffingRulesQuery } from "@/features/staffing-rules/queries/staffing-rules-queries";
import { useWorkersQuery } from "@/features/workers/queries/workers-queries";
import { getApiErrorMessage } from "@/lib/api-error-message";

type ScheduleStatus = ScheduleDetail["status"];

type ScheduleItem = {
  id: string;
  date: string;
  dayLabel: string;
  endTime: string;
  startTime: string;
  workerId: string | null;
  workerName: string;
};

type ScheduleCandidateItem = {
  id: string;
  date: string;
  endTime: string;
  isRecommended: boolean;
  startTime: string;
  workerId: string | null;
  workerName: string;
};

type ScheduleDraft = {
  date: string;
  endTime: string;
  startTime: string;
  workerId: string;
};

type ScheduleFormMode = "create" | "edit";

type UnfilledCondition = {
  id: string;
  assignedWorkers: number;
  date: string;
  dayLabel: string;
  requiredWorkers: number;
  timeRange: string;
};

type WorkerOption = {
  id: string;
  name: string;
};

type OperationMessage = {
  tone: "success" | "error";
  text: string;
};

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const EMPTY_WORKERS: Worker[] = [];

const EMPTY_DRAFT: ScheduleDraft = {
  date: "",
  endTime: "",
  startTime: "",
  workerId: "",
};

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  weekday: "long",
  timeZone: "Asia/Seoul",
});

function getDayLabel(date: string) {
  return KST_DATE_FORMATTER.format(new Date(`${date}T00:00:00+09:00`));
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + days));

  return nextDate.toISOString().slice(0, 10);
}

function createDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate || endDate < startDate) {
    return [];
  }

  const dates: string[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

function getMonday(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const dayIndex = targetDate.getUTCDay();
  const diff = dayIndex === 0 ? -6 : 1 - dayIndex;

  return addDays(date, diff);
}

function getSunday(date: string) {
  return addDays(getMonday(date), 6);
}

function createCalendarDates(startDate: string, endDate: string) {
  if (!startDate || !endDate || endDate < startDate) {
    return [];
  }

  return createDateRange(getMonday(startDate), getSunday(endDate));
}

function minutesToTime(minutes: number) {
  const minutesInDay = 24 * 60;
  const normalizedMinutes = ((minutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(normalizedMinutes / 60);
  const restMinutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(restMinutes).padStart(2, "0")}`;
}

function dateTimeToMinutes(date: string, dateTime: string) {
  const baseDate = new Date(`${date}T00:00:00.000Z`);
  const targetDate = new Date(dateTime);

  return Math.round((targetDate.getTime() - baseDate.getTime()) / 60000);
}

function dateTimeToTime(date: string, dateTime: string) {
  return minutesToTime(dateTimeToMinutes(date, dateTime));
}

function createDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(Date.UTC(year, month - 1, day, hours, minutes)).toISOString();
}

function createDraftFromSchedule(schedule: ScheduleItem): ScheduleDraft {
  return {
    date: schedule.date,
    endTime: schedule.endTime,
    startTime: schedule.startTime,
    workerId: schedule.workerId ?? "",
  };
}

function createScheduleAssignmentInput(draft: ScheduleDraft): ScheduleAssignmentInput {
  return {
    endsAt: createDateTime(draft.date, draft.endTime),
    startsAt: createDateTime(draft.date, draft.startTime),
    workDate: draft.date,
    workerId: draft.workerId,
  };
}

function validateScheduleDraft(draft: ScheduleDraft, workStartDate: string, workEndDate: string) {
  return {
    date: !draft.date
      ? "날짜를 선택하세요."
      : draft.date < workStartDate || draft.date > workEndDate
        ? "근무 시작 날짜와 종료 날짜 사이에서만 선택할 수 있습니다."
        : "",
    endTime: !draft.endTime
      ? "종료 시간을 선택하세요."
      : draft.startTime && draft.endTime <= draft.startTime
        ? "종료 시간은 시작 시간보다 늦어야 합니다."
        : "",
    startTime: !draft.startTime ? "시작 시간을 선택하세요." : "",
    workerId: !draft.workerId ? "근무자를 선택하세요." : "",
  };
}

function getStatusLabel(status: ScheduleStatus | null) {
  if (status === "DRAFT") {
    return "DRAFT";
  }

  if (status === "CONFIRMED") {
    return "CONFIRMED";
  }

  return "스케줄 없음";
}

function formatDateTitle(date: string) {
  return `${date} ${getDayLabel(date)}`;
}

function formatShortageTimeRange(shortage: ScheduleWorkerShortage) {
  return `${shortage.startTime}-${shortage.endTime}${shortage.endsNextDay ? "+1" : ""}`;
}

function assignmentToScheduleItem(assignment: ScheduleAssignment): ScheduleItem {
  return {
    date: assignment.workDate,
    dayLabel: getDayLabel(assignment.workDate),
    endTime: dateTimeToTime(assignment.workDate, assignment.endsAt),
    id: assignment.id,
    startTime: dateTimeToTime(assignment.workDate, assignment.startsAt),
    workerId: assignment.workerId,
    workerName: assignment.workerNameSnapshot,
  };
}

function candidateToScheduleCandidateItem(candidate: ScheduleCandidate): ScheduleCandidateItem {
  return {
    date: candidate.workDate,
    endTime: dateTimeToTime(candidate.workDate, candidate.endsAt),
    id: candidate.id,
    isRecommended: candidate.isRecommended,
    startTime: dateTimeToTime(candidate.workDate, candidate.startsAt),
    workerId: candidate.workerId,
    workerName: candidate.workerNameSnapshot,
  };
}

function shortageToUnfilledCondition(shortage: ScheduleWorkerShortage): UnfilledCondition {
  return {
    assignedWorkers: shortage.assignedCount,
    date: shortage.workDate,
    dayLabel: getDayLabel(shortage.workDate),
    id: shortage.id,
    requiredWorkers: shortage.requiredCount,
    timeRange: formatShortageTimeRange(shortage),
  };
}

function createWorkerOptions(workers: Worker[], editingSchedule: ScheduleItem | null) {
  const options: WorkerOption[] = workers.map((worker) => ({
    id: worker.id,
    name: worker.name,
  }));

  if (
    editingSchedule?.workerId &&
    !options.some((option) => option.id === editingSchedule.workerId)
  ) {
    options.push({
      id: editingSchedule.workerId,
      name: editingSchedule.workerName,
    });
  }

  return options;
}

export function MvpSchedulesPage() {
  const planningPeriodQuery = useActiveSchedulePlanningPeriodQuery();
  const workersQuery = useWorkersQuery();
  const staffingRulesQuery = useMinimumStaffingRulesQuery();
  const recommendScheduleMutation = useRecommendScheduleMutation();
  const createScheduleAssignmentMutation = useCreateScheduleAssignmentMutation();
  const updateScheduleAssignmentMutation = useUpdateScheduleAssignmentMutation();
  const deleteScheduleAssignmentMutation = useDeleteScheduleAssignmentMutation();
  const confirmScheduleMutation = useConfirmScheduleMutation();
  const activePlanningPeriod = planningPeriodQuery.data?.period ?? null;
  const workStartDate = activePlanningPeriod?.startDate ?? "";
  const workEndDate = activePlanningPeriod?.endDate ?? "";
  const draftScheduleQuery: DraftScheduleQuery = useMemo(
    () => ({
      endDate: workEndDate,
      startDate: workStartDate,
    }),
    [workEndDate, workStartDate],
  );
  const canQueryDraftSchedule = Boolean(workStartDate && workEndDate);
  const draftScheduleResult = useDraftScheduleQuery(draftScheduleQuery, canQueryDraftSchedule);
  const workers = workersQuery.data?.items ?? EMPTY_WORKERS;
  const staffingRules = staffingRulesQuery.data?.items ?? [];
  const schedule = draftScheduleResult.data?.schedule ?? null;
  const scheduleStatus = schedule?.status ?? null;
  const schedules = useMemo(
    () => schedule?.assignments.map(assignmentToScheduleItem) ?? [],
    [schedule],
  );
  const candidates = useMemo(
    () => schedule?.candidates.map(candidateToScheduleCandidateItem) ?? [],
    [schedule],
  );
  const unfilledConditions = useMemo(
    () => schedule?.workerShortages.map(shortageToUnfilledCondition) ?? [],
    [schedule],
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<ScheduleFormMode>("create");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateDetailDismissed, setDateDetailDismissed] = useState(false);
  const [draft, setDraft] = useState<ScheduleDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);
  const [operationMessage, setOperationMessage] = useState<OperationMessage | null>(null);
  const errors = useMemo(
    () => validateScheduleDraft(draft, workStartDate, workEndDate),
    [draft, workEndDate, workStartDate],
  );
  const calendarDates = useMemo(
    () => createCalendarDates(workStartDate, workEndDate),
    [workEndDate, workStartDate],
  );
  const editingSchedule = useMemo(
    () => schedules.find((item) => item.id === editingScheduleId) ?? null,
    [editingScheduleId, schedules],
  );
  const workerOptions = useMemo(
    () => createWorkerOptions(workers, editingSchedule),
    [editingSchedule, workers],
  );
  const hasErrors = Object.values(errors).some(Boolean);
  const isPageLoading =
    planningPeriodQuery.isPending ||
    staffingRulesQuery.isPending ||
    workersQuery.isPending ||
    (canQueryDraftSchedule && draftScheduleResult.isPending);
  const queryError =
    planningPeriodQuery.error ??
    staffingRulesQuery.error ??
    workersQuery.error ??
    draftScheduleResult.error;
  const queryErrorMessage = queryError
    ? getApiErrorMessage(queryError, "스케줄 정보를 불러오지 못했습니다.")
    : "";
  const isDraft = scheduleStatus === "DRAFT";
  const canGenerate =
    Boolean(activePlanningPeriod) &&
    staffingRules.length > 0 &&
    !schedule &&
    !draftScheduleResult.isFetching &&
    !recommendScheduleMutation.isPending &&
    !queryErrorMessage;
  const canConfirm =
    Boolean(schedule) &&
    isDraft &&
    schedules.length > 0 &&
    !confirmScheduleMutation.isPending &&
    !queryErrorMessage;
  const formTitle = formMode === "create" ? "스케줄 추가" : "스케줄 수정";
  const selectedDateSchedules = schedules.filter((item) => item.date === selectedDate);
  const selectedDateCandidates = candidates.filter((item) => item.date === selectedDate);
  const selectedDateUnfilledConditions = unfilledConditions.filter(
    (condition) => condition.date === selectedDate,
  );

  useEffect(() => {
    if (!schedule) {
      setSelectedDate("");
      setDateDetailDismissed(false);
      setFormOpen(false);
      setEditingScheduleId(null);
      setDraft(EMPTY_DRAFT);
      setSubmitted(false);
      return;
    }

    if (dateDetailDismissed) {
      return;
    }

    if (selectedDate && selectedDate >= schedule.startDate && selectedDate <= schedule.endDate) {
      return;
    }

    setSelectedDate(unfilledConditions[0]?.date ?? schedule.startDate);
  }, [dateDetailDismissed, schedule, selectedDate, unfilledConditions]);

  function openCreateForm(date: string) {
    if (!isDraft) {
      return;
    }

    setFormMode("create");
    setEditingScheduleId(null);
    setDateDetailDismissed(false);
    setSelectedDate(date);
    setDraft({ ...EMPTY_DRAFT, date });
    setSubmitted(false);
    setOperationMessage(null);
    setFormOpen(true);
  }

  function openEditForm(scheduleItem: ScheduleItem) {
    if (!isDraft) {
      return;
    }

    setFormMode("edit");
    setEditingScheduleId(scheduleItem.id);
    setDateDetailDismissed(false);
    setSelectedDate(scheduleItem.date);
    setDraft(createDraftFromSchedule(scheduleItem));
    setSubmitted(false);
    setOperationMessage(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSubmitted(false);
    setEditingScheduleId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function generateRecommendation() {
    if (!canGenerate || !activePlanningPeriod) {
      return;
    }

    setOperationMessage(null);

    try {
      const response = await recommendScheduleMutation.mutateAsync({
        endDate: activePlanningPeriod.endDate,
        startDate: activePlanningPeriod.startDate,
      });

      setDateDetailDismissed(false);
      setSelectedDate(response.workerShortages[0]?.workDate ?? response.startDate);
      setOperationMessage({
        tone: "success",
        text: "추천 스케줄이 생성되었습니다.",
      });
    } catch (error) {
      setOperationMessage({
        tone: "error",
        text: getApiErrorMessage(error, "추천 스케줄을 생성하지 못했습니다."),
      });
    }
  }

  async function saveSchedule() {
    setSubmitted(true);
    setOperationMessage(null);

    if (!schedule || !isDraft || hasErrors) {
      return;
    }

    const request = createScheduleAssignmentInput(draft);

    try {
      if (formMode === "create") {
        await createScheduleAssignmentMutation.mutateAsync({
          query: draftScheduleQuery,
          request,
          scheduleId: schedule.id,
        });
      } else if (editingScheduleId) {
        await updateScheduleAssignmentMutation.mutateAsync({
          assignmentId: editingScheduleId,
          query: draftScheduleQuery,
          request,
          scheduleId: schedule.id,
        });
      }

      setSelectedDate(draft.date);
      setDateDetailDismissed(false);
      closeForm();
      setOperationMessage({
        tone: "success",
        text: "스케줄이 저장되었습니다.",
      });
    } catch (error) {
      setOperationMessage({
        tone: "error",
        text: getApiErrorMessage(error, "스케줄을 저장하지 못했습니다."),
      });
    }
  }

  async function deleteSchedule() {
    if (!schedule || !deleteTarget || deleteScheduleAssignmentMutation.isPending) {
      return;
    }

    setOperationMessage(null);

    try {
      await deleteScheduleAssignmentMutation.mutateAsync({
        assignmentId: deleteTarget.id,
        query: draftScheduleQuery,
        scheduleId: schedule.id,
      });

      setDeleteTarget(null);
      closeForm();
      setOperationMessage({
        tone: "success",
        text: "스케줄이 삭제되었습니다.",
      });
    } catch (error) {
      setOperationMessage({
        tone: "error",
        text: getApiErrorMessage(error, "스케줄을 삭제하지 못했습니다."),
      });
    }
  }

  async function confirmCurrentSchedule() {
    if (!schedule || !canConfirm) {
      return;
    }

    setOperationMessage(null);

    try {
      await confirmScheduleMutation.mutateAsync({
        query: draftScheduleQuery,
        scheduleId: schedule.id,
      });

      setDateDetailDismissed(false);
      setSelectedDate("");
      closeForm();
      setConfirmOpen(false);
      setOperationMessage({
        tone: "success",
        text: "스케줄이 확정되었습니다.",
      });
    } catch (error) {
      setOperationMessage({
        tone: "error",
        text: getApiErrorMessage(error, "스케줄을 확정하지 못했습니다."),
      });
    }
  }

  return (
    <AdminPageShell
      title="스케줄"
      description="최소 인원 조건이 있는 시간대의 가능 시간과 계약 시간 균형을 기준으로 추천 결과를 생성하고 확정합니다."
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          {scheduleStatus === null ? (
            <Button
              type="button"
              variant="brand"
              onClick={() => {
                void generateRecommendation();
              }}
              disabled={!canGenerate}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {recommendScheduleMutation.isPending ? "생성 중" : "추천 생성"}
            </Button>
          ) : null}
          {isDraft ? (
            <Button
              type="button"
              variant="brand"
              onClick={() => setConfirmOpen(true)}
              disabled={!canConfirm}
            >
              {confirmScheduleMutation.isPending ? "확정 중" : "스케줄 확정"}
            </Button>
          ) : null}
        </div>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      {isPageLoading ? (
        <div className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted-foreground">
          스케줄 정보를 불러오는 중입니다.
        </div>
      ) : null}

      {queryErrorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {queryErrorMessage}
        </div>
      ) : null}

      {operationMessage ? (
        <div
          className={
            operationMessage.tone === "error"
              ? "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground"
          }
        >
          {operationMessage.text}
        </div>
      ) : null}

      {!activePlanningPeriod && !planningPeriodQuery.isPending ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">근무 기간 없음</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                가능 시간 관리에서 근무 기간을 먼저 설정하면 추천 스케줄을 생성할 수 있습니다.
              </p>
            </div>
            <Badge variant="neutral-weak">{getStatusLabel(null)}</Badge>
          </div>
        </section>
      ) : null}

      {activePlanningPeriod && !schedule && !draftScheduleResult.isPending ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">추천 결과 없음</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                가능 시간 관리에서 설정한 {workStartDate}~{workEndDate} 기간을 기준으로 추천 결과를
                생성합니다.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                동일 입력 조건에서는 중복 생성하지 않습니다. 최소 인원 조건이 있는 시간대만 추천
                대상으로 사용합니다.
              </p>
              {staffingRules.length === 0 ? (
                <p className="mt-2 text-sm text-destructive">
                  최소 인원 조건을 먼저 등록해야 추천 스케줄을 생성할 수 있습니다.
                </p>
              ) : null}
            </div>
            <Badge variant="neutral-weak">{getStatusLabel(scheduleStatus)}</Badge>
          </div>
        </section>
      ) : null}

      {unfilledConditions.length > 0 && isDraft ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">미충족 조건</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl border-collapse text-left text-sm">
              <thead className="bg-surface-secondary text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">요일</th>
                  <th className="px-6 py-3">시간대</th>
                  <th className="px-6 py-3">필요 인원</th>
                  <th className="px-6 py-3">추천 배정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unfilledConditions.map((condition) => (
                  <tr key={condition.id} className="bg-card">
                    <td className="px-6 py-4 font-medium text-foreground">{condition.dayLabel}</td>
                    <td className="px-6 py-4 text-muted-foreground">{condition.timeRange}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {condition.requiredWorkers}명
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {condition.assignedWorkers}명
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {schedule ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-foreground">근무 기간 달력</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {workStartDate}~{workEndDate} 추천 결과를 달력에서 검토하고 직접 조정합니다.
                </p>
              </div>
              <Badge variant="neutral-weak">{getStatusLabel(scheduleStatus)}</Badge>
            </div>
          </div>

          {calendarDates.length > 0 ? (
            <div className="overflow-x-auto p-6">
              <div className="grid min-w-3xl grid-cols-7 border-l border-t border-border">
                {WEEKDAY_LABELS.map((weekday) => (
                  <div
                    key={weekday}
                    className="border-b border-r border-border bg-surface-secondary px-3 py-2 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {weekday}
                  </div>
                ))}

                {calendarDates.map((date) => {
                  const inWorkRange = date >= workStartDate && date <= workEndDate;
                  const dateSchedules = schedules.filter((item) => item.date === date);
                  const dateCandidates = candidates.filter((item) => item.date === date);
                  const unfilled = unfilledConditions.some((condition) => condition.date === date);
                  const selected = selectedDate === date;
                  const visibleSchedules = dateSchedules.slice(0, 3);
                  const hiddenScheduleCount = dateSchedules.length - visibleSchedules.length;

                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={!inWorkRange}
                      onClick={() => {
                        setDateDetailDismissed(false);
                        setSelectedDate(date);
                        closeForm();
                      }}
                      className={
                        inWorkRange
                          ? [
                              "min-h-40 border-b border-r p-3 text-left transition-colors",
                              selected
                                ? "border-primary bg-accent"
                                : unfilled
                                  ? "border-destructive bg-destructive/5 hover:bg-destructive/10"
                                  : "border-border bg-card hover:bg-accent/60",
                            ].join(" ")
                          : "min-h-40 cursor-not-allowed border-b border-r border-border bg-surface-secondary p-3 text-left opacity-45"
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-foreground">{date.slice(8, 10)}</p>
                        {unfilled && inWorkRange ? (
                          <Badge
                            variant="neutral-weak"
                            size="sm"
                            className="border-destructive/30 bg-destructive/10 text-destructive"
                          >
                            미충족
                          </Badge>
                        ) : !inWorkRange ? (
                          <span className="text-xs font-medium text-muted-foreground">범위 밖</span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          후보 {dateCandidates.length}명 · 추천 {dateSchedules.length}명
                        </span>
                      </div>

                      <div className="mt-3 space-y-1">
                        {visibleSchedules.length > 0 ? (
                          visibleSchedules.map((item) => (
                            <p
                              key={item.id}
                              className="truncate text-xs font-medium text-foreground"
                            >
                              {item.startTime}-{item.endTime} {item.workerName}
                            </p>
                          ))
                        ) : !inWorkRange ? null : (
                          <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                            추천 배정 없음
                          </p>
                        )}
                        {hiddenScheduleCount > 0 ? (
                          <p className="text-xs font-medium text-muted-foreground">
                            +{hiddenScheduleCount}개 더보기
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">근무 날짜 범위를 확인하세요.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                근무 종료 날짜는 시작 날짜와 같거나 이후여야 합니다.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {selectedDate && schedule ? (
        <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-card shadow-modal">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">날짜별 스케줄</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  {formatDateTitle(selectedDate)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedDateSchedules.length}명 추천
                  {selectedDateCandidates.length > 0
                    ? ` · 후보 ${selectedDateCandidates.length}명`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="날짜 상세 닫기"
                onClick={() => {
                  setDateDetailDismissed(true);
                  setSelectedDate("");
                  closeForm();
                }}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {selectedDateUnfilledConditions.length > 0 ? (
              <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm font-semibold text-destructive">미충족 조건</p>
                <div className="mt-2 space-y-1">
                  {selectedDateUnfilledConditions.map((condition) => (
                    <p key={condition.id} className="text-sm text-foreground">
                      {condition.timeRange} · 필요 {condition.requiredWorkers}명 / 추천{" "}
                      {condition.assignedWorkers}명
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">가능 후보 목록</h3>
              {isDraft ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openCreateForm(selectedDate)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  스케줄 추가
                </Button>
              ) : null}
            </div>

            <div className="mt-5 space-y-2">
              {selectedDateCandidates.length > 0 ? (
                selectedDateCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={
                      candidate.isRecommended
                        ? "flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2"
                        : "flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
                    }
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {candidate.startTime}-{candidate.endTime}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {candidate.workerName}
                      </p>
                    </div>
                    {candidate.isRecommended ? (
                      <Badge variant="brand-weak" className="shrink-0">
                        <Check className="size-3" aria-hidden="true" />
                        추천
                      </Badge>
                    ) : (
                      <Badge variant="neutral-weak" className="shrink-0">
                        후보
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  이 날짜에 가능 후보가 없습니다.
                </p>
              )}
            </div>

            {formOpen ? (
              <section className="mt-6 rounded-xl border border-border bg-surface-secondary p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{formTitle}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTitle(draft.date)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label="폼 닫기"
                    onClick={closeForm}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-start-time">시작 시간</Label>
                      <Input
                        id="schedule-start-time"
                        type="time"
                        value={draft.startTime}
                        aria-invalid={submitted && Boolean(errors.startTime)}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, startTime: event.target.value }))
                        }
                      />
                      {submitted && errors.startTime ? (
                        <p className="text-sm text-destructive">{errors.startTime}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schedule-end-time">종료 시간</Label>
                      <Input
                        id="schedule-end-time"
                        type="time"
                        value={draft.endTime}
                        aria-invalid={submitted && Boolean(errors.endTime)}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, endTime: event.target.value }))
                        }
                      />
                      {submitted && errors.endTime ? (
                        <p className="text-sm text-destructive">{errors.endTime}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-worker">근무자</Label>
                    <Select
                      value={draft.workerId}
                      onValueChange={(value) =>
                        setDraft((current) => ({ ...current, workerId: value }))
                      }
                    >
                      <SelectTrigger
                        id="schedule-worker"
                        aria-invalid={submitted && Boolean(errors.workerId)}
                      >
                        <SelectValue placeholder="근무자를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {workerOptions.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {submitted && errors.workerId ? (
                      <p className="text-sm text-destructive">{errors.workerId}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    취소
                  </Button>
                  <Button
                    type="button"
                    variant="brand"
                    onClick={() => {
                      void saveSchedule();
                    }}
                    disabled={
                      createScheduleAssignmentMutation.isPending ||
                      updateScheduleAssignmentMutation.isPending
                    }
                  >
                    {createScheduleAssignmentMutation.isPending ||
                    updateScheduleAssignmentMutation.isPending
                      ? "저장 중"
                      : "저장"}
                  </Button>
                </div>
              </section>
            ) : null}

            <div className="mt-6">
              <h3 className="text-base font-semibold text-foreground">추천 배정 목록</h3>
            </div>

            <div className="mt-3 space-y-2">
              {selectedDateSchedules.length > 0 ? (
                selectedDateSchedules.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {item.startTime}-{item.endTime}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {item.workerName}
                      </p>
                    </div>
                    {isDraft ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          aria-label={`${item.workerName} 스케줄 수정`}
                          title="수정"
                          onClick={() => openEditForm(item)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`${item.workerName} 스케줄 삭제`}
                          title="삭제"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  이 날짜에 추천 배정이 없습니다.
                </p>
              )}
            </div>
          </div>
        </aside>
      ) : null}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>스케줄 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 스케줄을 삭제하면 해당 근무 후보가 목록에서 제거됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteScheduleAssignmentMutation.isPending}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void deleteSchedule();
              }}
              disabled={deleteScheduleAssignmentMutation.isPending}
            >
              {deleteScheduleAssignmentMutation.isPending ? "삭제 중" : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>스케줄 확정</AlertDialogTitle>
            <AlertDialogDescription>
              확정 후에는 이 근무 기간의 DRAFT 스케줄을 더 이상 수정할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmScheduleMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void confirmCurrentSchedule();
              }}
              disabled={!canConfirm}
            >
              {confirmScheduleMutation.isPending ? "확정 중" : "확정"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
