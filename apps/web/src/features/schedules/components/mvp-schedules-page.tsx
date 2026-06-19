"use client";

import { useMemo, useState } from "react";
import { Badge, Button } from "@moyeorak/design-system";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

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

type ScheduleStatus = "NONE" | "DRAFT" | "CONFIRMED";

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
  dayLabel: string;
  timeRange: string;
  requiredWorkers: number;
  assignedWorkers: number;
};

const WORKERS: Worker[] = [
  { id: "worker-1", name: "김민지" },
  { id: "worker-2", name: "박준호" },
  { id: "worker-3", name: "이서연" },
];

const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: "schedule-1",
    date: "2026-06-22",
    dayLabel: "월요일",
    startTime: "18:00",
    endTime: "22:00",
    workerId: "worker-1",
  },
  {
    id: "schedule-2",
    date: "2026-06-24",
    dayLabel: "수요일",
    startTime: "18:00",
    endTime: "22:00",
    workerId: "worker-1",
  },
  {
    id: "schedule-3",
    date: "2026-06-26",
    dayLabel: "금요일",
    startTime: "14:00",
    endTime: "22:00",
    workerId: "worker-2",
  },
];

const INITIAL_UNFILLED_CONDITIONS: UnfilledCondition[] = [
  {
    id: "unfilled-1",
    dayLabel: "금요일",
    timeRange: "18:00-22:00",
    requiredWorkers: 3,
    assignedWorkers: 1,
  },
];

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
  const nextDate = new Date(`${date}T00:00:00+09:00`);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function createDraftFromSchedule(schedule: ScheduleItem): ScheduleDraft {
  return {
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    workerId: schedule.workerId,
  };
}

function validateScheduleDraft(draft: ScheduleDraft, weekStart: string, weekEnd: string) {
  return {
    date: !draft.date
      ? "날짜를 선택하세요."
      : draft.date < weekStart || draft.date > weekEnd
        ? "선택한 주차 안의 날짜만 선택할 수 있습니다."
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

function getStatusLabel(status: ScheduleStatus) {
  if (status === "DRAFT") {
    return "작성 중";
  }

  if (status === "CONFIRMED") {
    return "확정";
  }

  return "스케줄 없음";
}

export function MvpSchedulesPage() {
  const [weekStart, setWeekStart] = useState("2026-06-22");
  const weekEnd = addDays(weekStart, 6);
  const [status, setStatus] = useState<ScheduleStatus>("DRAFT");
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [unfilledConditions, setUnfilledConditions] = useState<UnfilledCondition[]>(
    INITIAL_UNFILLED_CONDITIONS,
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<ScheduleFormMode>("create");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState<ScheduleDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const errors = useMemo(
    () => validateScheduleDraft(draft, weekStart, weekEnd),
    [draft, weekEnd, weekStart],
  );
  const hasErrors = Object.values(errors).some(Boolean);
  const isConfirmed = status === "CONFIRMED";
  const canExport = isConfirmed && schedules.length > 0;
  const formTitle = formMode === "create" ? "스케줄 추가" : "스케줄 수정";

  function openCreateForm() {
    setFormMode("create");
    setEditingScheduleId(null);
    setDraft({ ...EMPTY_DRAFT, date: weekStart });
    setSubmitted(false);
    setFormOpen(true);
  }

  function openEditForm(schedule: ScheduleItem) {
    setFormMode("edit");
    setEditingScheduleId(schedule.id);
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
    if (status === "DRAFT") {
      return;
    }

    setStatus("DRAFT");
    setSchedules(INITIAL_SCHEDULES);
    setUnfilledConditions(INITIAL_UNFILLED_CONDITIONS);
    setExportMessage("");
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
      setStatus("DRAFT");
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
      description="특정 주차의 추천 스케줄을 생성하고, 조정한 뒤 확정하거나 CSV로 내보냅니다."
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={generateRecommendation}
            disabled={status === "DRAFT"}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            추천 생성
          </Button>
          <Button type="button" variant="outline" onClick={openCreateForm} disabled={isConfirmed}>
            <Plus className="size-4" aria-hidden="true" />
            스케줄 추가
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={() => setConfirmOpen(true)}
            disabled={isConfirmed || schedules.length === 0}
          >
            스케줄 확정
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canExport}
            onClick={() => setExportMessage("확정 스케줄 CSV export가 준비되었습니다.")}
          >
            <Download className="size-4" aria-hidden="true" />
            CSV export
          </Button>
        </div>
      }
      containerClassName="max-w-none"
      contentClassName="space-y-6"
    >
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {weekStart} ~ {weekEnd}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            선택 주차 기준으로 추천과 확정을 진행합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            이전 주
          </Button>
          <Badge variant={status === "CONFIRMED" ? "brand-weak" : "neutral-weak"}>
            {getStatusLabel(status)}
          </Badge>
          <Button
            type="button"
            variant="outline"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            다음 주
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      {exportMessage ? (
        <div className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted-foreground">
          {exportMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">주간 스케줄</h2>
        </div>

        {schedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl border-collapse text-left text-sm">
              <thead className="bg-surface-secondary text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">요일</th>
                  <th className="px-6 py-3">날짜</th>
                  <th className="px-6 py-3">시간</th>
                  <th className="px-6 py-3">근무자</th>
                  <th className="px-6 py-3 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="bg-card">
                    <td className="px-6 py-4 font-medium text-foreground">{schedule.dayLabel}</td>
                    <td className="px-6 py-4 text-muted-foreground">{schedule.date}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {schedule.startTime}-{schedule.endTime}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {getWorkerName(schedule.workerId)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isConfirmed}
                          onClick={() => openEditForm(schedule)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          수정
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isConfirmed}
                          onClick={() => setDeleteTarget(schedule)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">선택한 주차의 스케줄이 없습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              추천 생성을 실행하거나 스케줄을 직접 추가하세요.
            </p>
          </div>
        )}
      </section>

      {unfilledConditions.length > 0 && status === "DRAFT" ? (
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

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-form-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-modal"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="schedule-form-title" className="text-lg font-semibold text-foreground">
                  {formTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  선택 주차 안에서 날짜, 시간, 근무자를 입력하세요.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="닫기"
                onClick={closeForm}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">날짜</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  min={weekStart}
                  max={weekEnd}
                  value={draft.date}
                  aria-invalid={submitted && Boolean(errors.date)}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, date: event.target.value }))
                  }
                />
                {submitted && errors.date ? (
                  <p className="text-sm text-destructive">{errors.date}</p>
                ) : null}
              </div>

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

            <div className="mt-8 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                취소
              </Button>
              <Button type="button" variant="brand" onClick={saveSchedule}>
                저장
              </Button>
            </div>
          </section>
        </div>
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
              확정 후에는 이 주차의 스케줄을 최종본으로 관리합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setStatus("CONFIRMED");
                setUnfilledConditions([]);
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
