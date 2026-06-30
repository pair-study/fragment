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
import { CalendarDays, CircleAlert, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Controller, type FieldErrors, type Resolver, useForm } from "react-hook-form";
import { z } from "zod";

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

type ScheduleTimeGroup = {
  endTime: string;
  id: string;
  items: ScheduleItem[];
  startTime: string;
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

type UnfilledConditionGroup = {
  conditions: UnfilledCondition[];
  date: string;
  dayLabel: string;
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
const DEFAULT_VISIBLE_UNFILLED_GROUPS = 5;
const DEFAULT_VISIBLE_SCHEDULE_GROUPS = 3;
const MAX_VISIBLE_WORKER_NAMES = 2;
const MAX_PREVIEW_UNFILLED_CONDITIONS = 3;

const EMPTY_DRAFT: ScheduleDraft = {
  date: "",
  endTime: "",
  startTime: "",
  workerId: "",
};

const TIME_OPTION_STEP_MINUTES = 30;

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

function createTimeOptions() {
  const options: { label: string; value: string }[] = [];

  for (let minutes = 0; minutes < 24 * 60; minutes += TIME_OPTION_STEP_MINUTES) {
    const time = minutesToTime(minutes);

    options.push({
      label: time,
      value: time,
    });
  }

  return options;
}

const SCHEDULE_TIME_OPTIONS = createTimeOptions();

function dateTimeToMinutes(date: string, dateTime: string) {
  const baseDate = new Date(`${date}T00:00:00.000Z`);
  const targetDate = new Date(dateTime);

  return Math.round((targetDate.getTime() - baseDate.getTime()) / 60000);
}

function dateTimeToTime(date: string, dateTime: string) {
  return minutesToTime(dateTimeToMinutes(date, dateTime));
}

function createDateTime(date: string, time: string, addDay = false) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(Date.UTC(year, month - 1, day + (addDay ? 1 : 0), hours, minutes)).toISOString();
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
  const endsNextDay = draft.endTime < draft.startTime;

  return {
    endsAt: createDateTime(draft.date, draft.endTime, endsNextDay),
    startsAt: createDateTime(draft.date, draft.startTime),
    workDate: draft.date,
    workerId: draft.workerId,
  };
}

const createScheduleFormSchema = (workStartDate: string, workEndDate: string) =>
  z
    .object({
      date: z.string().min(1, "날짜를 선택하세요."),
      endTime: z.string().min(1, "종료 시간을 선택하세요."),
      startTime: z.string().min(1, "시작 시간을 선택하세요."),
      workerId: z.string().min(1, "근무자를 선택하세요."),
    })
    .superRefine((value, context) => {
      if (
        value.date &&
        workStartDate &&
        workEndDate &&
        (value.date < workStartDate || value.date > workEndDate)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "근무 시작 날짜와 종료 날짜 사이에서만 선택할 수 있습니다.",
          path: ["date"],
        });
      }

      if (value.startTime && value.endTime && value.startTime === value.endTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "종료 시간은 시작 시간과 달라야 합니다.",
          path: ["endTime"],
        });
      }
    });

const createScheduleFormResolver =
  (workStartDate: string, workEndDate: string): Resolver<ScheduleDraft> =>
  (values) => {
    const result = createScheduleFormSchema(workStartDate, workEndDate).safeParse(values);

    if (result.success) {
      return {
        errors: {},
        values,
      };
    }

    const errors: FieldErrors<ScheduleDraft> = {};

    result.error.issues.forEach((issue) => {
      const [field] = issue.path;

      if (
        field === "date" ||
        field === "startTime" ||
        field === "endTime" ||
        field === "workerId"
      ) {
        errors[field] = {
          type: "manual",
          message: issue.message,
        };
      }
    });

    return {
      errors,
      values: {},
    };
  };

function createScheduleEndTimeOptions(startTime: string) {
  return SCHEDULE_TIME_OPTIONS.filter((option) => option.value !== startTime).map((option) => ({
    ...option,
    label: startTime && option.value < startTime ? `${option.value} 다음날` : option.label,
  }));
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

function formatShortDateTitle(date: string) {
  const [, month, day] = date.split("-");

  return `${Number(month)}월 ${Number(day)}일`;
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

function getTimeRangeLabel(group: Pick<ScheduleTimeGroup, "endTime" | "startTime">) {
  return `${group.startTime}-${group.endTime}`;
}

function getWorkerNamesPreview(workerNames: string[]) {
  const visibleWorkerNames = workerNames.slice(0, MAX_VISIBLE_WORKER_NAMES);
  const hiddenWorkerCount = workerNames.length - visibleWorkerNames.length;
  const visibleLabel = visibleWorkerNames.join(", ");

  if (hiddenWorkerCount <= 0) {
    return visibleLabel;
  }

  return `${visibleLabel} 외 ${hiddenWorkerCount}명`;
}

function groupSchedulesByTime(schedules: ScheduleItem[]): ScheduleTimeGroup[] {
  const groupsByTime = new Map<string, ScheduleTimeGroup>();

  schedules.forEach((schedule) => {
    const key = `${schedule.startTime}-${schedule.endTime}`;
    const group = groupsByTime.get(key);

    if (group) {
      group.items.push(schedule);
      return;
    }

    groupsByTime.set(key, {
      endTime: schedule.endTime,
      id: key,
      items: [schedule],
      startTime: schedule.startTime,
    });
  });

  return [...groupsByTime.values()].sort((left, right) => {
    const startCompare = left.startTime.localeCompare(right.startTime);

    if (startCompare !== 0) {
      return startCompare;
    }

    return left.endTime.localeCompare(right.endTime);
  });
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

function groupUnfilledConditionsByDate(conditions: UnfilledCondition[]): UnfilledConditionGroup[] {
  const groupsByDate = new Map<string, UnfilledConditionGroup>();

  conditions.forEach((condition) => {
    const group = groupsByDate.get(condition.date);

    if (group) {
      group.conditions.push(condition);
      return;
    }

    groupsByDate.set(condition.date, {
      conditions: [condition],
      date: condition.date,
      dayLabel: condition.dayLabel,
    });
  });

  return [...groupsByDate.values()]
    .map((group) => ({
      ...group,
      conditions: [...group.conditions].sort((left, right) =>
        left.timeRange.localeCompare(right.timeRange),
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function getShortageCount(condition: UnfilledCondition) {
  return Math.max(condition.requiredWorkers - condition.assignedWorkers, 0);
}

function getUnfilledConditionLabel(condition: UnfilledCondition) {
  return `${condition.timeRange} ${getShortageCount(condition)}명 부족`;
}

function getUnfilledConditionPreview(conditions: UnfilledCondition[]) {
  const visibleConditions = conditions.slice(0, MAX_PREVIEW_UNFILLED_CONDITIONS);
  const hiddenConditionCount = conditions.length - visibleConditions.length;
  const visibleLabel = visibleConditions.map(getUnfilledConditionLabel).join(" · ");

  if (hiddenConditionCount <= 0) {
    return visibleLabel;
  }

  return `${visibleLabel} · +${hiddenConditionCount}개`;
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
  const unfilledConditionGroups = useMemo(
    () => groupUnfilledConditionsByDate(unfilledConditions),
    [unfilledConditions],
  );
  const scheduleTargetDates = useMemo(
    () =>
      new Set([
        ...schedules.map((item) => item.date),
        ...candidates.map((item) => item.date),
        ...unfilledConditions.map((condition) => condition.date),
      ]),
    [candidates, schedules, unfilledConditions],
  );
  const firstScheduleTargetDate = useMemo(
    () => unfilledConditions[0]?.date ?? schedules[0]?.date ?? candidates[0]?.date ?? "",
    [candidates, schedules, unfilledConditions],
  );
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<ScheduleDraft>({
    defaultValues: EMPTY_DRAFT,
    resolver: createScheduleFormResolver(workStartDate, workEndDate),
  });
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<ScheduleFormMode>("create");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateDetailDismissed, setDateDetailDismissed] = useState(false);
  const [showUnfilledDetails, setShowUnfilledDetails] = useState(false);
  const [operationMessage, setOperationMessage] = useState<OperationMessage | null>(null);
  const scheduleFormDate = watch("date");
  const scheduleFormStartTime = watch("startTime");
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
    (!schedule || isDraft) &&
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
  const selectedDateCandidates = candidates.filter(
    (item) => item.date === selectedDate && !item.isRecommended,
  );
  const selectedDateUnfilledConditions = unfilledConditions.filter(
    (condition) => condition.date === selectedDate,
  );
  const visibleUnfilledConditionGroups = unfilledConditionGroups.slice(
    0,
    DEFAULT_VISIBLE_UNFILLED_GROUPS,
  );
  const hiddenUnfilledGroupCount =
    unfilledConditionGroups.length - visibleUnfilledConditionGroups.length;
  const isSelectedDateScheduleTarget = scheduleTargetDates.has(selectedDate);
  const scheduleEndTimeOptions = useMemo(
    () => createScheduleEndTimeOptions(scheduleFormStartTime),
    [scheduleFormStartTime],
  );

  useEffect(() => {
    if (!schedule) {
      setSelectedDate("");
      setDateDetailDismissed(false);
      setFormOpen(false);
      setEditingScheduleId(null);
      reset(EMPTY_DRAFT);
      return;
    }

    if (dateDetailDismissed) {
      return;
    }

    if (
      selectedDate &&
      selectedDate >= schedule.startDate &&
      selectedDate <= schedule.endDate &&
      scheduleTargetDates.has(selectedDate)
    ) {
      return;
    }

    setSelectedDate(firstScheduleTargetDate);
  }, [
    dateDetailDismissed,
    firstScheduleTargetDate,
    reset,
    schedule,
    scheduleTargetDates,
    selectedDate,
  ]);

  function openCreateForm(date: string) {
    if (!isDraft) {
      return;
    }

    setFormMode("create");
    setEditingScheduleId(null);
    setDateDetailDismissed(false);
    setSelectedDate(date);
    reset({ ...EMPTY_DRAFT, date });
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
    reset(createDraftFromSchedule(scheduleItem));
    setOperationMessage(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingScheduleId(null);
    reset(EMPTY_DRAFT);
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
        text: schedule ? "추천 스케줄이 다시 생성되었습니다." : "추천 스케줄이 생성되었습니다.",
      });
    } catch (error) {
      setOperationMessage({
        tone: "error",
        text: getApiErrorMessage(error, "추천 스케줄을 생성하지 못했습니다."),
      });
    }
  }

  async function saveSchedule(values: ScheduleDraft) {
    setOperationMessage(null);

    if (!schedule || !isDraft) {
      return;
    }

    const request = createScheduleAssignmentInput(values);

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

      setSelectedDate(values.date);
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
          {scheduleStatus === null || isDraft ? (
            <Button
              type="button"
              variant="brand"
              onClick={() => {
                void generateRecommendation();
              }}
              disabled={!canGenerate}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {recommendScheduleMutation.isPending
                ? "생성 중"
                : schedule
                  ? "추천 다시 생성"
                  : "추천 생성"}
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
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="neutral-weak"
                  className="border-destructive/30 bg-destructive/10 text-destructive"
                >
                  미충족
                </Badge>
                <h2 className="text-base font-semibold text-foreground">미충족 조건</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {unfilledConditions.length}개 조건이 {unfilledConditionGroups.length}일에 걸쳐
                부족합니다.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUnfilledDetails((currentValue) => !currentValue)}
            >
              {showUnfilledDetails ? "상세 접기" : "상세 보기"}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {visibleUnfilledConditionGroups.map((group) => (
              <button
                key={group.date}
                type="button"
                className="rounded-md border border-destructive/20 bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => {
                  setDateDetailDismissed(false);
                  setSelectedDate(group.date);
                  closeForm();
                }}
              >
                <span className="font-semibold text-foreground">
                  {formatShortDateTitle(group.date)}
                </span>
                <span className="ml-2 text-muted-foreground">{group.conditions.length}개</span>
              </button>
            ))}
            {hiddenUnfilledGroupCount > 0 ? (
              <span className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground">
                +{hiddenUnfilledGroupCount}일
              </span>
            ) : null}
          </div>

          {showUnfilledDetails ? (
            <div className="mt-4 space-y-2 border-t border-destructive/20 pt-4">
              {unfilledConditionGroups.map((group) => (
                <button
                  key={group.date}
                  type="button"
                  className="grid w-full gap-2 rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring sm:grid-cols-[10rem_1fr]"
                  onClick={() => {
                    setDateDetailDismissed(false);
                    setSelectedDate(group.date);
                    closeForm();
                  }}
                >
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {formatShortDateTitle(group.date)}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {group.conditions.length}개 조건
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getUnfilledConditionPreview(group.conditions)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
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
                  const dateScheduleGroups = groupSchedulesByTime(dateSchedules);
                  const visibleScheduleGroups = dateScheduleGroups.slice(
                    0,
                    DEFAULT_VISIBLE_SCHEDULE_GROUPS,
                  );
                  const hiddenScheduleGroupCount =
                    dateScheduleGroups.length - visibleScheduleGroups.length;
                  const unfilled = unfilledConditions.some((condition) => condition.date === date);
                  const hasScheduleTarget = scheduleTargetDates.has(date);
                  const selected = selectedDate === date;

                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={!inWorkRange || !hasScheduleTarget}
                      onClick={() => {
                        setDateDetailDismissed(false);
                        setSelectedDate(date);
                        closeForm();
                      }}
                      className={
                        inWorkRange
                          ? [
                              "flex min-h-40 flex-col items-stretch border-b border-r p-3 text-left transition-colors",
                              !hasScheduleTarget
                                ? "cursor-not-allowed border-border bg-surface-secondary opacity-45"
                                : selected
                                  ? "border-primary bg-accent"
                                  : unfilled
                                    ? "border-destructive bg-destructive/5 hover:bg-destructive/10"
                                    : "border-border bg-card hover:bg-accent/60",
                            ].join(" ")
                          : "flex min-h-40 cursor-not-allowed flex-col items-stretch border-b border-r border-border bg-surface-secondary p-3 text-left opacity-45"
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
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {visibleScheduleGroups.map((group) => (
                          <div
                            key={group.id}
                            className="block w-full rounded-md bg-surface-secondary px-2 py-1.5 text-left"
                          >
                            <span className="block truncate text-xs font-semibold text-foreground">
                              {getTimeRangeLabel(group)}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] leading-4 text-muted-foreground">
                              {getWorkerNamesPreview(group.items.map((item) => item.workerName))}
                            </span>
                          </div>
                        ))}

                        {hiddenScheduleGroupCount > 0 ? (
                          <p className="text-xs font-semibold text-primary">+ 더보기</p>
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

      {selectedDate && schedule && isSelectedDateScheduleTarget ? (
        <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-card shadow-modal">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">날짜별 스케줄</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  {formatDateTitle(selectedDate)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  추천 {selectedDateSchedules.length}건
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
              <div className="mb-5 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <CircleAlert className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">최소 인원 미달</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      시간대별 기준에 미달한 항목만 표시합니다.
                    </p>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border border-border">
                  {selectedDateUnfilledConditions.map((condition) => (
                    <div
                      key={condition.id}
                      className="grid gap-2 border-b border-border px-3 py-3 last:border-b-0 sm:grid-cols-[7rem_1fr_auto] sm:items-center"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {condition.timeRange}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        배정 {condition.assignedWorkers}명 · 최소 {condition.requiredWorkers}명
                      </span>
                      <Badge
                        variant="neutral-weak"
                        className="w-fit border-destructive/20 bg-destructive/10 text-destructive"
                      >
                        {getShortageCount(condition)}명 부족
                      </Badge>
                    </div>
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
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {candidate.startTime}-{candidate.endTime}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {candidate.workerName}
                      </p>
                    </div>
                    <Badge variant="neutral-weak" className="shrink-0">
                      후보
                    </Badge>
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
                      {scheduleFormDate ? formatDateTitle(scheduleFormDate) : "날짜 미선택"}
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
                      <Controller
                        control={control}
                        name="startTime"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);

                              if (watch("endTime") === value) {
                                setValue("endTime", "");
                              }
                            }}
                          >
                            <SelectTrigger
                              id="schedule-start-time"
                              aria-invalid={Boolean(errors.startTime)}
                            >
                              <SelectValue placeholder="시작 시간 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {SCHEDULE_TIME_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.startTime ? (
                        <p className="text-sm text-destructive">{errors.startTime.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schedule-end-time">종료 시간</Label>
                      <Controller
                        control={control}
                        name="endTime"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger
                              id="schedule-end-time"
                              aria-invalid={Boolean(errors.endTime)}
                            >
                              <SelectValue placeholder="종료 시간 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {scheduleEndTimeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.endTime ? (
                        <p className="text-sm text-destructive">{errors.endTime.message}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-worker">근무자</Label>
                    <Controller
                      control={control}
                      name="workerId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            id="schedule-worker"
                            aria-invalid={Boolean(errors.workerId)}
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
                      )}
                    />
                    {errors.workerId ? (
                      <p className="text-sm text-destructive">{errors.workerId.message}</p>
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
                    onClick={handleSubmit(saveSchedule)}
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
              {selectedDateSchedules.length > 0
                ? selectedDateSchedules.map((item) => (
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
                : null}
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
