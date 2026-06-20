"use client";

import { useMemo, useState } from "react";
import { Badge, Button } from "@moyeorak/design-system";
import { CalendarDays, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";

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

type ScheduleStatus = "DRAFT" | "CONFIRMED";

type Worker = {
  id: string;
  name: string;
};

type ScheduleItem = {
  id: string;
  date: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  workerId: string;
};

type ScheduleDraft = {
  date: string;
  startTime: string;
  endTime: string;
  workerId: string;
};

type ScheduleFormMode = "create" | "edit";

type UnfilledCondition = {
  id: string;
  date: string;
  dayLabel: string;
  timeRange: string;
  requiredWorkers: number;
  assignedWorkers: number;
};

const WORKERS: Worker[] = [
  { id: "worker-1", name: "김민지" },
  { id: "worker-2", name: "박준호" },
  { id: "worker-3", name: "이서연" },
  { id: "worker-4", name: "최유나" },
  { id: "worker-5", name: "정도윤" },
  { id: "worker-6", name: "한서준" },
  { id: "worker-7", name: "오하린" },
  { id: "worker-8", name: "강지우" },
  { id: "worker-9", name: "윤태오" },
  { id: "worker-10", name: "임서아" },
  { id: "worker-11", name: "조민규" },
  { id: "worker-12", name: "배수빈" },
  { id: "worker-13", name: "문지훈" },
  { id: "worker-14", name: "신예린" },
  { id: "worker-15", name: "남현우" },
  { id: "worker-16", name: "서다은" },
  { id: "worker-17", name: "권도현" },
  { id: "worker-18", name: "백지민" },
  { id: "worker-19", name: "유시우" },
  { id: "worker-20", name: "홍나연" },
];

const INITIAL_UNFILLED_CONDITIONS: UnfilledCondition[] = [
  {
    id: "unfilled-1",
    date: "2026-06-26",
    dayLabel: "금요일",
    timeRange: "18:00-22:00",
    requiredWorkers: 20,
    assignedWorkers: 17,
  },
];

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const RECOMMENDATION_WORK_START_DATE = "2026-06-20";
const RECOMMENDATION_WORK_END_DATE = "2026-07-05";

const EMPTY_DRAFT: ScheduleDraft = {
  date: "",
  startTime: "",
  endTime: "",
  workerId: "",
};

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  weekday: "long",
  timeZone: "Asia/Seoul",
});

function getWorkerName(workerId: string) {
  return WORKERS.find((worker) => worker.id === workerId)?.name ?? "알 수 없음";
}

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

function createDraftFromSchedule(schedule: ScheduleItem): ScheduleDraft {
  return {
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    workerId: schedule.workerId,
  };
}

function validateScheduleDraft(draft: ScheduleDraft, workStartDate: string, workEndDate: string) {
  return {
    date: !draft.date
      ? "날짜를 선택하세요."
      : draft.date < workStartDate || draft.date > workEndDate
        ? "근무 시작 날짜와 종료 날짜 사이에서만 선택할 수 있습니다."
        : "",
    startTime: !draft.startTime ? "시작 시간을 선택하세요." : "",
    endTime: !draft.endTime
      ? "종료 시간을 선택하세요."
      : draft.startTime && draft.endTime <= draft.startTime
        ? "종료 시간은 시작 시간보다 늦어야 합니다."
        : "",
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

function createRecommendedSchedules(workStartDate: string, workEndDate: string) {
  const availableDates = createDateRange(workStartDate, workEndDate);
  const denseDate = "2026-06-26";
  const timeRanges = [
    ["09:00", "13:00"],
    ["10:00", "14:00"],
    ["13:00", "17:00"],
    ["14:00", "18:00"],
    ["18:00", "22:00"],
  ];

  return WORKERS.map((worker, index) => {
    const [startTime, endTime] = timeRanges[index % timeRanges.length];
    const date =
      index < 17 ? denseDate : (availableDates[(index + 2) % availableDates.length] ?? workEndDate);

    return {
      id: `schedule-${index + 1}`,
      date,
      startTime,
      endTime,
      workerId: worker.id,
    };
  }).map((schedule) => ({
    ...schedule,
    dayLabel: getDayLabel(schedule.date),
  }));
}

export function MvpSchedulesPage() {
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [unfilledConditions, setUnfilledConditions] = useState<UnfilledCondition[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<ScheduleFormMode>("create");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [draft, setDraft] = useState<ScheduleDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(
    () =>
      validateScheduleDraft(draft, RECOMMENDATION_WORK_START_DATE, RECOMMENDATION_WORK_END_DATE),
    [draft],
  );
  const calendarDates = useMemo(
    () => createCalendarDates(RECOMMENDATION_WORK_START_DATE, RECOMMENDATION_WORK_END_DATE),
    [],
  );
  const hasErrors = Object.values(errors).some(Boolean);
  const canGenerate = scheduleStatus === null;
  const isDraft = scheduleStatus === "DRAFT";
  const formTitle = formMode === "create" ? "스케줄 추가" : "스케줄 수정";
  const selectedDateSchedules = schedules.filter((schedule) => schedule.date === selectedDate);
  const selectedDateUnfilledConditions = unfilledConditions.filter(
    (condition) => condition.date === selectedDate,
  );

  function openCreateForm(date: string) {
    setFormMode("create");
    setEditingScheduleId(null);
    setSelectedDate(date);
    setDraft({ ...EMPTY_DRAFT, date });
    setSubmitted(false);
    setFormOpen(true);
  }

  function openEditForm(schedule: ScheduleItem) {
    setFormMode("edit");
    setEditingScheduleId(schedule.id);
    setSelectedDate(schedule.date);
    setDraft(createDraftFromSchedule(schedule));
    setSubmitted(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSubmitted(false);
    setEditingScheduleId(null);
    setDraft(EMPTY_DRAFT);
  }

  function generateRecommendation() {
    if (!canGenerate) {
      return;
    }

    setScheduleStatus("DRAFT");
    setSchedules(
      createRecommendedSchedules(RECOMMENDATION_WORK_START_DATE, RECOMMENDATION_WORK_END_DATE),
    );
    setUnfilledConditions(INITIAL_UNFILLED_CONDITIONS);
    setSelectedDate(INITIAL_UNFILLED_CONDITIONS[0]?.date ?? RECOMMENDATION_WORK_START_DATE);
  }

  function saveSchedule() {
    setSubmitted(true);

    if (hasErrors) {
      return;
    }

    const nextSchedule = {
      date: draft.date,
      dayLabel: getDayLabel(draft.date),
      startTime: draft.startTime,
      endTime: draft.endTime,
      workerId: draft.workerId,
    };

    if (formMode === "create") {
      setSchedules((currentSchedules) => [
        ...currentSchedules,
        {
          id: `schedule-${Date.now()}`,
          ...nextSchedule,
        },
      ]);
      setScheduleStatus("DRAFT");
    } else if (editingScheduleId) {
      setSchedules((currentSchedules) =>
        currentSchedules.map((schedule) =>
          schedule.id === editingScheduleId ? { ...schedule, ...nextSchedule } : schedule,
        ),
      );
    }

    closeForm();
  }

  return (
    <AdminPageShell
      title="스케줄"
      description="근무자, 가능 시간, 최소 인원 조건을 기준으로 추천 결과를 생성하고 확정합니다."
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          {scheduleStatus === null ? (
            <Button
              type="button"
              variant="brand"
              onClick={generateRecommendation}
              disabled={!canGenerate}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              추천 생성
            </Button>
          ) : null}
          {isDraft ? (
            <Button
              type="button"
              variant="brand"
              onClick={() => setConfirmOpen(true)}
              disabled={schedules.length === 0}
            >
              스케줄 확정
            </Button>
          ) : null}
        </div>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      {scheduleStatus === null ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">추천 결과 없음</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                가능 시간 관리에서 설정한 {RECOMMENDATION_WORK_START_DATE}~
                {RECOMMENDATION_WORK_END_DATE} 기간을 기준으로 추천 결과를 생성합니다.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                동일 입력 조건에서는 중복 생성하지 않습니다. 근무자, 가능 시간, 최소 인원 조건, 근무
                기간 중 하나가 변경되면 다시 추천 생성할 수 있습니다.
              </p>
            </div>
            <Badge variant="neutral-weak">{getStatusLabel(scheduleStatus)}</Badge>
          </div>
        </section>
      ) : null}

      {unfilledConditions.length > 0 && scheduleStatus === "DRAFT" ? (
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
                  <th className="px-6 py-3">배정 인원</th>
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

      {scheduleStatus !== null ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-foreground">근무 기간 달력</h2>
                  <Badge variant={scheduleStatus === "CONFIRMED" ? "brand-weak" : "neutral-weak"}>
                    {getStatusLabel(scheduleStatus)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {RECOMMENDATION_WORK_START_DATE}~{RECOMMENDATION_WORK_END_DATE} 추천 결과를
                  달력에서 검토하고 직접 조정합니다.
                </p>
              </div>
            </div>
          </div>

          {calendarDates.length > 0 ? (
            <div className="p-6">
              <div className="grid grid-cols-7 border-l border-t border-border">
                {WEEKDAY_LABELS.map((weekday) => (
                  <div
                    key={weekday}
                    className="border-b border-r border-border bg-surface-secondary px-3 py-2 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {weekday}
                  </div>
                ))}

                {calendarDates.map((date) => {
                  const inWorkRange =
                    date >= RECOMMENDATION_WORK_START_DATE && date <= RECOMMENDATION_WORK_END_DATE;
                  const dateSchedules = schedules.filter((schedule) => schedule.date === date);
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
                        <span>{dateSchedules.length}명 배정</span>
                      </div>

                      <div className="mt-3 space-y-1">
                        {visibleSchedules.length > 0 ? (
                          visibleSchedules.map((schedule) => (
                            <p
                              key={schedule.id}
                              className="truncate text-xs font-medium text-foreground"
                            >
                              {schedule.startTime}-{schedule.endTime}{" "}
                              {getWorkerName(schedule.workerId)}
                            </p>
                          ))
                        ) : !inWorkRange ? null : (
                          <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                            배정 없음
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

      {selectedDate && scheduleStatus !== null ? (
        <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-card shadow-modal">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">날짜별 스케줄</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  {formatDateTitle(selectedDate)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedDateSchedules.length}명 배정
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="날짜 상세 닫기"
                onClick={() => {
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
                      {condition.timeRange} · 필요 {condition.requiredWorkers}명 / 배정{" "}
                      {condition.assignedWorkers}명
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">배정 목록</h3>
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

            {formOpen ? (
              <section className="mt-5 rounded-xl border border-border bg-surface-secondary p-4">
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
                        {WORKERS.map((worker) => (
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
                  <Button type="button" variant="brand" onClick={saveSchedule}>
                    저장
                  </Button>
                </div>
              </section>
            ) : null}

            <div className="mt-5 space-y-2">
              {selectedDateSchedules.length > 0 ? (
                selectedDateSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {schedule.startTime}-{schedule.endTime}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {getWorkerName(schedule.workerId)}
                      </p>
                    </div>
                    {isDraft ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          aria-label={`${getWorkerName(schedule.workerId)} 스케줄 수정`}
                          title="수정"
                          onClick={() => openEditForm(schedule)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`${getWorkerName(schedule.workerId)} 스케줄 삭제`}
                          title="삭제"
                          onClick={() => setDeleteTarget(schedule)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  이 날짜에 배정된 스케줄이 없습니다.
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
              이 스케줄을 삭제하면 해당 근무 배정이 목록에서 제거됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }

                setSchedules((currentSchedules) =>
                  currentSchedules.filter((schedule) => schedule.id !== deleteTarget.id),
                );
                setDeleteTarget(null);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>스케줄 확정</AlertDialogTitle>
            <AlertDialogDescription>
              확정 후에는 이 근무 기간의 스케줄을 최종본으로 관리합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setScheduleStatus(null);
                setSchedules([]);
                setUnfilledConditions([]);
                setSelectedDate("");
                closeForm();
                setConfirmOpen(false);
              }}
            >
              확정
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
